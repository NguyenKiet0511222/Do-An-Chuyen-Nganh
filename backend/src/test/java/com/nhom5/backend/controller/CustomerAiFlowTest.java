package com.nhom5.backend.controller;

import com.nhom5.backend.dto.ai.AiPrediction;
import com.nhom5.backend.entity.User;
import com.nhom5.backend.entity.enums.AccountTier;
import com.nhom5.backend.entity.enums.AiSource;
import com.nhom5.backend.repository.AiResultRepository;
import com.nhom5.backend.service.AiServiceClient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.Map;
import java.util.Optional;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Kiểm tra nhanh của khách Premium (api.md mục 3.3, 4.7). AiServiceClient được mock;
 * bean mock tạo context Spring riêng -> dùng DB H2 riêng như SellerProductAiFlowTest.
 * <p>
 * DB này KHÔNG bật MODE=MSSQLServer: ở chế độ đó H2 coi các NULL trong cột UNIQUE là trùng nhau, nên ràng buộc
 * unique Hibernate tự sinh cho ai_results.product_image_id (@OneToOne) chặn dòng QUICK_CHECK thứ 2 (product_image_id
 * NULL). SQL Server thật không bị: script 03_catalog.sql tạo filtered index "WHERE product_image_id IS NOT NULL",
 * và SQLServerDialect của Hibernate cũng sinh unique index bỏ qua NULL.
 */
@TestPropertySource(properties =
        "spring.datasource.url=jdbc:h2:mem:nongsan_customer_ai_test;DB_CLOSE_DELAY=-1")
class CustomerAiFlowTest extends ApiTestSupport {

    @MockitoBean
    private AiServiceClient aiServiceClient;

    @Autowired
    private AiResultRepository aiResultRepository;

    @Test
    void standardAccountIsBlocked() throws Exception {
        String token = login(registerCustomer(), "secret123");

        call(multipart("/api/ai/classify").file(png("image")), token)
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Tính năng dành cho tài khoản Premium"));
        call(get("/api/ai/history"), token).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/ai/history")).andExpect(status().isUnauthorized());
    }

    @Test
    void premiumClassifySavesHistoryAndAppliesReviewThreshold() throws Exception {
        String email = registerCustomer();
        String token = login(email, "secret123");
        makePremium(email);

        when(aiServiceClient.classify(any(), any(), any())).thenReturn(Optional.of(new AiPrediction(
                "Tomato_Rotten", "Tomato", "rotten", 0.93456, Map.of("tomato_rotten", 0.93456), "mobilenetv2-pt-v1")));
        long id = readLong(call(multipart("/api/ai/classify").file(png("image")), token)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.label").value("ROTTEN"))
                .andExpect(jsonPath("$.data.produce").value("tomato"))
                .andExpect(jsonPath("$.data.confidence").value(0.9346))
                .andExpect(jsonPath("$.data.modelVersion").value("mobilenetv2-pt-v1"))
                .andExpect(jsonPath("$.data.imageUrl", startsWith("/uploads/ai/"))), "$.data.id");

        // Dưới ngưỡng review (0.70 mặc định) -> UNCERTAIN; field "file" cũng nhận
        when(aiServiceClient.classify(any(), any(), any())).thenReturn(Optional.of(new AiPrediction(
                "apple_fresh", "apple", "fresh", 0.55, Map.of(), "mobilenetv2-pt-v1")));
        call(multipart("/api/ai/classify").file(png("file")), token)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.label").value("UNCERTAIN"));

        call(get("/api/ai/history"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(2)))
                .andExpect(jsonPath("$.data.content[1].id").value((int) id));
        call(get("/api/ai/history/" + id), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.label").value("ROTTEN"));

        // Khách Premium khác không xem được
        String otherEmail = registerCustomer();
        String other = login(otherEmail, "secret123");
        makePremium(otherEmail);
        call(get("/api/ai/history/" + id), other).andExpect(status().isNotFound());
        call(get("/api/ai/history"), other).andExpect(jsonPath("$.data.content", hasSize(0)));

        // Không lẫn vào hàng chờ kiểm định của admin
        call(get("/api/admin/ai/results/" + id), adminToken()).andExpect(status().isNotFound());
    }

    @Test
    void aiDownReturns503AndSavesNothing() throws Exception {
        String email = registerCustomer();
        String token = login(email, "secret123");
        User user = makePremium(email);
        when(aiServiceClient.classify(any(), any(), any())).thenReturn(Optional.empty());

        call(multipart("/api/ai/classify").file(png("image")), token).andExpect(status().isServiceUnavailable());
        call(multipart("/api/ai/classify"), token).andExpect(status().isBadRequest());
        assertEquals(0, aiResultRepository.countBySourceAndUserIdAndCreatedAtGreaterThanEqual(
                AiSource.QUICK_CHECK, user.getId(), java.time.LocalDate.now().atStartOfDay()));
    }

    @Test
    void dailyLimit() throws Exception {
        String email = registerCustomer();
        String token = login(email, "secret123");
        makePremium(email);
        when(aiServiceClient.classify(any(), any(), any())).thenReturn(Optional.of(new AiPrediction(
                "banana_fresh", "banana", "fresh", 0.99, Map.of(), "mobilenetv2-pt-v1")));

        for (int i = 0; i < 20; i++) {
            call(multipart("/api/ai/classify").file(png("image")), token).andExpect(status().isCreated());
        }
        call(multipart("/api/ai/classify").file(png("image")), token).andExpect(status().isTooManyRequests());
    }

    private User makePremium(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        user.setAccountTier(AccountTier.PREMIUM);
        return userRepository.save(user);
    }
}
