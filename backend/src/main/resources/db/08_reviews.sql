-- Buoc 8: danh gia san pham (api.md muc 2, 3.6, 4.4 - POST / GET /api/products/{id}/reviews).
-- Bang da co trong ERD (api.md muc 2) nhung truoc 31/10/2026 chua tao. Entity tuong ung: Review.
-- Chi khach co don DELIVERED chua san pham moi danh gia duoc; moi (san pham, khach, don) 1 lan.
-- Chay sau 07_settings.sql.
USE nongsan_db;
GO

IF OBJECT_ID(N'dbo.reviews', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.reviews (
        id          BIGINT IDENTITY(1,1) NOT NULL,
        product_id  BIGINT          NOT NULL,
        user_id     BIGINT          NOT NULL,
        order_id    BIGINT          NOT NULL,
        rating      TINYINT         NOT NULL,
        comment     NVARCHAR(1000)  NULL,
        created_at  DATETIME2       NOT NULL CONSTRAINT df_reviews_created DEFAULT SYSDATETIME(),
        updated_at  DATETIME2       NULL,
        CONSTRAINT pk_reviews PRIMARY KEY (id),
        CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES dbo.products (id) ON DELETE CASCADE,
        CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES dbo.users (id),
        CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES dbo.orders (id),
        CONSTRAINT uk_reviews_product_user_order UNIQUE (product_id, user_id, order_id),
        CONSTRAINT ck_reviews_rating CHECK (rating BETWEEN 1 AND 5)
    );
    CREATE INDEX ix_reviews_product ON dbo.reviews (product_id);
END
GO
