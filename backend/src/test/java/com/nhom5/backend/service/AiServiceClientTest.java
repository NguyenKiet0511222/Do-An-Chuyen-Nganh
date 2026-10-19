package com.nhom5.backend.service;

import com.nhom5.backend.config.AppProperties;
import com.nhom5.backend.dto.ai.AiHealth;
import com.nhom5.backend.dto.ai.AiPrediction;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Client gọi AI service, chạy trên HTTP server giả của JDK (không cần Python): đúng multipart field "image"
 * kèm filename + content-type ảnh, đọc đúng JSON snake_case, lỗi gì cũng trả rỗng.
 */
class AiServiceClientTest {

    private static final byte[] PNG_BYTES = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};
    private static final String PREDICTION_JSON = """
            { "label": "apple_fresh", "produce_type": "apple", "condition": "fresh", "confidence": 0.9312,
              "all_scores": { "apple_fresh": 0.9312, "apple_rotten": 0.0688 }, "model_version": "mobilenetv2-pt-v1",
              "field_moi_them_sau": 1 }""";

    private record Recorded(String method, String path, String contentType, byte[] body) {
    }

    private final List<Recorded> requests = new CopyOnWriteArrayList<>();
    private HttpServer server;
    private ExecutorService handlers;

    @BeforeEach
    void startServer() throws IOException {
        server = HttpServer.create(new InetSocketAddress(InetAddress.getLoopbackAddress(), 0), 0);
        handlers = Executors.newCachedThreadPool(); // handler chậm (giả timeout) không chặn server.stop
        server.setExecutor(handlers);
        server.start();
    }

    @AfterEach
    void stopServer() {
        server.stop(0);
        handlers.shutdownNow();
    }

    @Test
    void classifySendsMultipartImageAndMapsSnakeCaseJson() {
        respond("/classify", 200, PREDICTION_JSON, 0);

        Optional<AiPrediction> result = client(true, 2000).classify(PNG_BYTES, "tao do.png", "image/png");

        assertThat(result).isPresent();
        AiPrediction p = result.get();
        assertThat(p.label()).isEqualTo("apple_fresh");
        assertThat(p.produceType()).isEqualTo("apple");
        assertThat(p.condition()).isEqualTo("fresh");
        assertThat(p.isRotten()).isFalse();
        assertThat(p.confidence()).isEqualTo(0.9312);
        assertThat(p.allScores()).containsEntry("apple_rotten", 0.0688).hasSize(2);
        assertThat(p.modelVersion()).isEqualTo("mobilenetv2-pt-v1");

        assertThat(requests).hasSize(1);
        Recorded req = requests.get(0);
        assertThat(req.method()).isEqualTo("POST");
        assertThat(req.path()).isEqualTo("/classify");
        assertThat(req.contentType()).startsWith("multipart/form-data");
        String body = new String(req.body(), StandardCharsets.ISO_8859_1);
        assertThat(body).contains("name=\"image\"").contains("filename=\"tao do.png\"").contains("Content-Type: image/png");
        assertThat(body).contains(new String(PNG_BYTES, StandardCharsets.ISO_8859_1));
    }

    /** Người bán hay đặt tên file có dấu — không được biến thành "AI lỗi". */
    @Test
    void classifyAcceptsVietnameseFilename() {
        respond("/classify", 200, PREDICTION_JSON, 0);

        assertThat(client(true, 2000).classify(PNG_BYTES, "Táo đỏ Đà Lạt.png", "image/png")).isPresent();
        String body = new String(requests.get(0).body(), StandardCharsets.ISO_8859_1);
        assertThat(body).contains("name=\"image\"").contains("Content-Type: image/png");
    }

    @Test
    void classifyReturnsEmptyWhenModelNotLoaded503() {
        respond("/classify", 503, "{\"detail\":\"Model chưa được nạp\"}", 0);

        assertThat(client(true, 2000).classify(PNG_BYTES, "a.png", "image/png")).isEmpty();
    }

    /** Kết quả sai hợp đồng -> coi như AI lỗi. */
    @ParameterizedTest
    @ValueSource(strings = {
            "{\"label\":\"apple_unknown\",\"produce_type\":\"apple\",\"condition\":\"unknown\",\"confidence\":0.9}",
            "{\"label\":\"apple_fresh\",\"produce_type\":\"apple\",\"condition\":\"fresh\",\"confidence\":93.12}",
            "{\"label\":\"apple_fresh\",\"produce_type\":\"apple\",\"condition\":\"fresh\",\"confidence\":-0.1}",
            "{\"label\":\"apple_fresh\",\"condition\":\"fresh\",\"confidence\":0.9}",
            "{\"label\":\"\",\"produce_type\":\"apple\",\"condition\":\"fresh\",\"confidence\":0.9}",
            "{\"label\":\"apple_fresh\",\"produce_type\":\"apple\",\"condition\":\"fresh\"}",
            "khong phai json"
    })
    void classifyReturnsEmptyWhenResponseBreaksContract(String json) {
        respond("/classify", 200, json, 0);

        assertThat(client(true, 2000).classify(PNG_BYTES, "a.png", "image/png")).isEmpty();
    }

    @Test
    void classifyReturnsEmptyOnTimeout() {
        respond("/classify", 200, PREDICTION_JSON, 1500);

        long start = System.nanoTime();
        Optional<AiPrediction> result = client(true, 300).classify(PNG_BYTES, "a.png", "image/png");
        long elapsedMs = (System.nanoTime() - start) / 1_000_000;

        assertThat(result).isEmpty();
        assertThat(elapsedMs).isLessThan(1500);
    }

    @Test
    void classifyReturnsEmptyWhenServiceIsDown() {
        AiServiceClient client = client(true, 500);
        server.stop(0);

        assertThat(client.classify(PNG_BYTES, "a.png", "image/png")).isEmpty();
        assertThat(client.health()).isEmpty();
    }

    @Test
    void disabledNeverCallsNetwork() {
        respond("/classify", 200, PREDICTION_JSON, 0);
        respond("/health", 200, "{\"status\":\"UP\"}", 0);
        AiServiceClient client = client(false, 2000);

        assertThat(client.isEnabled()).isFalse();
        assertThat(client.classify(PNG_BYTES, "a.png", "image/png")).isEmpty();
        assertThat(client.health()).isEmpty();
        assertThat(requests).isEmpty();
    }

    @Test
    void healthMapsSnakeCaseJson() {
        respond("/health", 200, """
                { "status": "UP", "model_loaded": true, "model_version": "mobilenetv2-pt-v1", "num_classes": 28,
                  "labels": ["apple_fresh"], "device": "cpu", "error": null }""", 0);

        Optional<AiHealth> health = client(true, 2000).health();

        assertThat(health).isPresent();
        assertThat(health.get().status()).isEqualTo("UP");
        assertThat(health.get().modelLoaded()).isTrue();
        assertThat(health.get().isReady()).isTrue();
        assertThat(health.get().modelVersion()).isEqualTo("mobilenetv2-pt-v1");
    }

    // ---------- helpers ----------

    private AiServiceClient client(boolean enabled, int timeoutMs) {
        String baseUrl = "http://" + server.getAddress().getHostString() + ":" + server.getAddress().getPort();
        AppProperties.Ai ai = new AppProperties.Ai(baseUrl, enabled, 0.90, 0.70, timeoutMs);
        return new AiServiceClient(new AppProperties(null, ai, null, null, null, null, null));
    }

    /** Trả JSON cố định cho 1 đường dẫn (chờ delayMs trước khi trả để giả timeout) và ghi lại request nhận được. */
    private void respond(String path, int status, String json, long delayMs) {
        server.createContext(path, exchange -> {
            requests.add(new Recorded(exchange.getRequestMethod(), exchange.getRequestURI().getPath(),
                    exchange.getRequestHeaders().getFirst("Content-Type"), exchange.getRequestBody().readAllBytes()));
            try {
                Thread.sleep(delayMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(status, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
    }
}
