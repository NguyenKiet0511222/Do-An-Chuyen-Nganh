package com.nhom5.backend.controller;

import com.nhom5.backend.entity.Shop;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Admin tra cứu shop (mục 4.9) và quản trị danh mục (mục 4.3). */
class AdminShopCategoryFlowTest extends ApiTestSupport {

    @Test
    void shopListAndDetailIncludeOwnerAndCounts() throws Exception {
        String admin = adminToken();
        Shop shop = shopOf(SELLER_EMAIL);
        orderFor(approvedProduct(SELLER_EMAIL, 5), 1);

        call(get("/api/admin/shops").param("keyword", SELLER_EMAIL), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].id").value(shop.getId().intValue()))
                .andExpect(jsonPath("$.data.content[0].owner.email").value(SELLER_EMAIL))
                .andExpect(jsonPath("$.data.content[0].productCounts.approved", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.content[0].orderCount", greaterThanOrEqualTo(1)));

        call(get("/api/admin/shops").param("status", "LOCKED").param("size", "100"), admin)
                .andExpect(jsonPath("$.data.content[*].id", not(hasItem(shop.getId().intValue()))));
        call(get("/api/admin/shops").param("status", "NOPE"), admin).andExpect(status().isBadRequest());

        call(get("/api/admin/shops/" + shop.getId()), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.shopName").value(shop.getShopName()))
                .andExpect(jsonPath("$.data.owner.fullName").isString())
                .andExpect(jsonPath("$.data.productCounts.pending").isNumber());
        call(get("/api/admin/shops/99999999"), admin).andExpect(status().isNotFound());
        call(get("/api/admin/shops"), sellerToken()).andExpect(status().isForbidden());
    }

    @Test
    void categoryCrudKeepsTwoLevelTree() throws Exception {
        String admin = adminToken();
        String name = "Nấm " + UUID.randomUUID().toString().substring(0, 4);

        long parentId = readLong(callJson(post("/api/admin/categories"), admin,
                "{\"name\":\"" + name + "\",\"aiProduceKeys\":\" Mushroom, ENOKI ,,\",\"isActive\":false}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.slug").isString())
                .andExpect(jsonPath("$.data.isActive").value(false))
                .andExpect(jsonPath("$.data.aiProduceKeys").value("mushroom,enoki"))
                .andExpect(jsonPath("$.data.children", hasSize(0))), "$.data.id");
        long childId = readLong(callJson(post("/api/admin/categories"), admin,
                "{\"name\":\"Nấm kim châm\",\"parentId\":" + parentId + "}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.parentId").value((int) parentId)), "$.data.id");

        // Cây chỉ 2 cấp
        callJson(post("/api/admin/categories"), admin, "{\"name\":\"Cấp 3\",\"parentId\":" + childId + "}")
                .andExpect(status().isBadRequest());
        callJson(put("/api/admin/categories/" + parentId), admin, "{\"name\":\"" + name + "\",\"parentId\":" + parentId + "}")
                .andExpect(status().isBadRequest());
        long otherRoot = categoryRepository.findBySlug("cu-qua").orElseThrow().getId();
        callJson(put("/api/admin/categories/" + parentId), admin, "{\"name\":\"" + name + "\",\"parentId\":" + otherRoot + "}")
                .andExpect(status().isBadRequest());
        callJson(post("/api/admin/categories"), admin, "{\"name\":\"\"}").andExpect(status().isBadRequest());

        // Admin thấy cả danh mục ẩn
        call(get("/api/admin/categories"), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].id", hasItem((int) parentId)));

        // Đổi tên giữ slug
        String slug = categoryRepository.findById(childId).orElseThrow().getSlug();
        callJson(put("/api/admin/categories/" + childId), admin,
                "{\"name\":\"Nấm kim châm Hàn Quốc\",\"parentId\":" + parentId + ",\"displayOrder\":3}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Nấm kim châm Hàn Quốc"))
                .andExpect(jsonPath("$.data.slug").value(slug))
                .andExpect(jsonPath("$.data.displayOrder").value(3));

        // Xoá: còn con -> 409, có sản phẩm -> 409
        call(delete("/api/admin/categories/" + parentId), admin).andExpect(status().isConflict());
        call(delete("/api/admin/categories/" + otherRoot), admin).andExpect(status().isConflict());
        call(delete("/api/admin/categories/" + childId), admin).andExpect(status().isOk());
        call(delete("/api/admin/categories/" + parentId), admin).andExpect(status().isOk());
        call(delete("/api/admin/categories/" + parentId), admin).andExpect(status().isNotFound());

        call(get("/api/admin/categories"), sellerToken()).andExpect(status().isForbidden());
    }
}
