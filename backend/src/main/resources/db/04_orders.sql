-- Buoc 4: don hang (api.md muc 2, 3.4, 3.5). 1 don = 1 shop; checkout nhieu shop -> nhieu don chung checkout_group_id.
-- Entity tuong ung: Order, OrderItem, OrderStatusHistory. Thay doi cot -> sua ca entity va bao nhom.
-- Chay sau 03_catalog.sql.
USE nongsan_db;
GO

IF OBJECT_ID(N'dbo.orders', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.orders (
        id                 BIGINT IDENTITY(1,1) NOT NULL,
        order_code         VARCHAR(20)    NOT NULL,             -- DH-{yyyy}-{5 chu so}
        checkout_group_id  VARCHAR(36)    NOT NULL,             -- UUID chung cua 1 lan checkout
        user_id            BIGINT         NOT NULL,             -- khach dat
        shop_id            BIGINT         NOT NULL,
        status             VARCHAR(20)    NOT NULL CONSTRAINT df_orders_status DEFAULT 'PENDING',
        payment_method     VARCHAR(20)    NOT NULL CONSTRAINT df_orders_payment_method DEFAULT 'COD',
        payment_status     VARCHAR(20)    NOT NULL CONSTRAINT df_orders_payment_status DEFAULT 'UNPAID',
        receiver_name      NVARCHAR(100)  NOT NULL,
        phone              VARCHAR(20)    NOT NULL,
        shipping_address   NVARCHAR(500)  NOT NULL,
        note               NVARCHAR(500)  NULL,
        subtotal           BIGINT         NOT NULL,             -- VND
        shipping_fee       BIGINT         NOT NULL,
        total              BIGINT         NOT NULL,
        cancel_reason      NVARCHAR(500)  NULL,
        confirmed_at       DATETIME2      NULL,
        delivered_at       DATETIME2      NULL,
        cancelled_at       DATETIME2      NULL,
        created_at         DATETIME2      NOT NULL CONSTRAINT df_orders_created DEFAULT SYSDATETIME(),
        updated_at         DATETIME2      NULL,
        CONSTRAINT pk_orders PRIMARY KEY (id),
        CONSTRAINT uk_orders_code UNIQUE (order_code),
        CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES dbo.users (id),
        CONSTRAINT fk_orders_shop FOREIGN KEY (shop_id) REFERENCES dbo.shops (id),
        CONSTRAINT ck_orders_status CHECK (status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED')),
        CONSTRAINT ck_orders_payment_method CHECK (payment_method IN ('COD')),
        CONSTRAINT ck_orders_payment_status CHECK (payment_status IN ('UNPAID', 'PAID'))
    );
    CREATE INDEX ix_orders_shop_status ON dbo.orders (shop_id, status);
    CREATE INDEX ix_orders_user ON dbo.orders (user_id);
END
GO

IF OBJECT_ID(N'dbo.order_items', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.order_items (
        id                 BIGINT IDENTITY(1,1) NOT NULL,
        order_id           BIGINT         NOT NULL,
        product_id         BIGINT         NOT NULL,             -- san pham da co don thi khong duoc xoa (chi an)
        product_name       NVARCHAR(200)  NOT NULL,             -- snapshot luc dat
        unit               NVARCHAR(20)   NOT NULL,
        price              BIGINT         NOT NULL,             -- don gia snapshot
        quantity           INT            NOT NULL,
        subtotal           BIGINT         NOT NULL,
        ai_label_snapshot  VARCHAR(20)    NULL,
        created_at         DATETIME2      NOT NULL CONSTRAINT df_order_items_created DEFAULT SYSDATETIME(),
        updated_at         DATETIME2      NULL,
        CONSTRAINT pk_order_items PRIMARY KEY (id),
        CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES dbo.orders (id) ON DELETE CASCADE,
        CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES dbo.products (id),
        CONSTRAINT ck_order_items_quantity CHECK (quantity > 0)
    );
    CREATE INDEX ix_order_items_order ON dbo.order_items (order_id);
    CREATE INDEX ix_order_items_product ON dbo.order_items (product_id);
END
GO

IF OBJECT_ID(N'dbo.order_status_history', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.order_status_history (
        id           BIGINT IDENTITY(1,1) NOT NULL,
        order_id     BIGINT         NOT NULL,
        from_status  VARCHAR(20)    NULL,                       -- NULL o dong tao don
        to_status    VARCHAR(20)    NOT NULL,
        changed_by   BIGINT         NULL,
        note         NVARCHAR(500)  NULL,                       -- vd ma van don, ly do huy
        created_at   DATETIME2      NOT NULL CONSTRAINT df_order_history_created DEFAULT SYSDATETIME(),
        updated_at   DATETIME2      NULL,
        CONSTRAINT pk_order_status_history PRIMARY KEY (id),
        CONSTRAINT fk_order_history_order FOREIGN KEY (order_id) REFERENCES dbo.orders (id) ON DELETE CASCADE,
        CONSTRAINT fk_order_history_user FOREIGN KEY (changed_by) REFERENCES dbo.users (id)
    );
    CREATE INDEX ix_order_history_order ON dbo.order_status_history (order_id);
END
GO
