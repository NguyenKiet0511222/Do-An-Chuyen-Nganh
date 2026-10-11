-- Buoc 6: lich su duyet san pham (api.md muc 3.2, 4.9 - GET /admin/products/{id} tra "lich su duyet").
-- BANG MOI (them 11/10/2026, chua co trong ERD goc) - da bao nhom. Entity tuong ung: ProductReviewHistory.
-- Moi lan nguoi ban gui duyet (SUBMIT) hoac admin APPROVE / REJECT / NEED_INFO / HIDE / UNHIDE ghi 1 dong.
-- Chay sau 05_addresses_cart.sql.
USE nongsan_db;
GO

IF OBJECT_ID(N'dbo.product_review_history', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.product_review_history (
        id           BIGINT IDENTITY(1,1) NOT NULL,
        product_id   BIGINT         NOT NULL,
        actor_id     BIGINT         NULL,                       -- nguoi ban (SUBMIT) hoac admin; NULL neu tai khoan da xoa
        action       VARCHAR(20)    NOT NULL,
        from_status  VARCHAR(20)    NULL,
        to_status    VARCHAR(20)    NOT NULL,
        reason       NVARCHAR(500)  NULL,                       -- ly do tu choi / can bo sung / an
        created_at   DATETIME2      NOT NULL CONSTRAINT df_product_review_history_created DEFAULT SYSDATETIME(),
        updated_at   DATETIME2      NULL,
        CONSTRAINT pk_product_review_history PRIMARY KEY (id),
        CONSTRAINT fk_product_review_history_product FOREIGN KEY (product_id) REFERENCES dbo.products (id) ON DELETE CASCADE,
        CONSTRAINT fk_product_review_history_actor FOREIGN KEY (actor_id) REFERENCES dbo.users (id),
        CONSTRAINT ck_product_review_history_action CHECK (action IN ('SUBMIT', 'APPROVE', 'REJECT', 'NEED_INFO', 'HIDE', 'UNHIDE')),
        CONSTRAINT ck_product_review_history_from CHECK (from_status IS NULL OR from_status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'NEED_INFO', 'HIDDEN')),
        CONSTRAINT ck_product_review_history_to CHECK (to_status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'NEED_INFO', 'HIDDEN'))
    );
    CREATE INDEX ix_product_review_history_product ON dbo.product_review_history (product_id);
END
GO
