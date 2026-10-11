-- Buoc 5: so dia chi + gio hang (api.md muc 2, 3.4, 4.2, 4.5). Hai bang nay da co trong ERD, truoc day chi duoc ddl-auto tu tao.
-- Entity tuong ung: Address, CartItem. Thay doi cot -> sua ca entity va bao nhom.
-- Chay sau 04_orders.sql.
USE nongsan_db;
GO

IF OBJECT_ID(N'dbo.addresses', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.addresses (
        id             BIGINT IDENTITY(1,1) NOT NULL,
        user_id        BIGINT         NOT NULL,
        receiver_name  NVARCHAR(100)  NOT NULL,
        phone          VARCHAR(20)    NOT NULL,
        province       NVARCHAR(100)  NOT NULL,
        district       NVARCHAR(100)  NOT NULL,
        ward           NVARCHAR(100)  NULL,
        street         NVARCHAR(255)  NOT NULL,
        is_default     BIT            NOT NULL CONSTRAINT df_addresses_default DEFAULT 0,   -- moi user toi da 1 dia chi mac dinh (code dam bao)
        created_at     DATETIME2      NOT NULL CONSTRAINT df_addresses_created DEFAULT SYSDATETIME(),
        updated_at     DATETIME2      NULL,
        CONSTRAINT pk_addresses PRIMARY KEY (id),
        CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES dbo.users (id)
    );
    CREATE INDEX ix_addresses_user ON dbo.addresses (user_id);
END
GO

IF OBJECT_ID(N'dbo.cart_items', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.cart_items (
        id          BIGINT IDENTITY(1,1) NOT NULL,
        user_id     BIGINT    NOT NULL,
        product_id  BIGINT    NOT NULL,
        quantity    INT       NOT NULL,
        created_at  DATETIME2 NOT NULL CONSTRAINT df_cart_items_created DEFAULT SYSDATETIME(),
        updated_at  DATETIME2 NULL,
        CONSTRAINT pk_cart_items PRIMARY KEY (id),
        CONSTRAINT uk_cart_items_user_product UNIQUE (user_id, product_id),   -- 1 san pham 1 dong, them lai thi cong don
        CONSTRAINT fk_cart_items_user FOREIGN KEY (user_id) REFERENCES dbo.users (id),
        CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES dbo.products (id) ON DELETE CASCADE,
        CONSTRAINT ck_cart_items_quantity CHECK (quantity > 0)
    );
END
GO
