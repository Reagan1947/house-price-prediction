CREATE DATABASE IF NOT EXISTS ftm DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE ftm;

DROP TABLE IF EXISTS user;
CREATE TABLE user
(
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    user_account  VARCHAR(50)     NOT NULL COMMENT '账号',
    user_password VARCHAR(512)    NOT NULL COMMENT '密码',
    user_email    VARCHAR(50)     NOT NULL COMMENT '用户邮箱',
    user_phone    VARCHAR(50)     NULL     DEFAULT NULL COMMENT '用户手机号',
    user_name     VARCHAR(256)    NULL     DEFAULT NULL COMMENT '用户昵称',
    user_avatar   VARCHAR(512)    NULL     DEFAULT NULL COMMENT '用户头像',
    user_profile  VARCHAR(512)    NULL     DEFAULT NULL COMMENT '用户简介',
    user_role     VARCHAR(20)     NULL     DEFAULT 'USER' COMMENT '用户角色（USER-普通用户, ADMIN-管理员）',
    is_disabled   TINYINT         NOT NULL DEFAULT 0 COMMENT '是否禁用（0-正常, 1-禁用）',
    is_delete     TINYINT         NOT NULL DEFAULT 0 COMMENT '是否删除（0-正常, 1-删除）',
    edit_time     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '编辑时间',
    create_time   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id) USING BTREE,
    UNIQUE INDEX uk_user_account (user_account ASC) USING BTREE,
    UNIQUE INDEX uk_user_email (user_email ASC) USING BTREE,
    UNIQUE INDEX uk_user_phone (user_phone ASC) USING BTREE,
    INDEX idx_user_name (user_name ASC) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 12
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci COMMENT = '用户表'
  ROW_FORMAT = DYNAMIC;

INSERT INTO user
VALUES (1, 'admin', '123456', '510132075@qq.com', '15279292310', '管理员', NULL, NULL, 'ADMIN', 0, 0,
        '2025-04-03 20:45:00', '2025-04-03 20:45:00', '2025-04-03 20:45:00');
INSERT INTO user
VALUES (2, 'user1', '123456', '1@qq.com', NULL, '用户1', NULL, NULL, 'USER', 0, 0, '2025-04-03 20:45:00',
        '2025-04-03 20:45:00', '2025-04-03 20:45:00');
INSERT INTO user
VALUES (3, 'user2', '123456', '2@qq.com', NULL, '用户2', NULL, NULL, 'USER', 0, 0, '2025-04-03 20:45:00',
        '2025-04-03 20:45:00', '2025-04-03 20:45:00');
INSERT INTO user
VALUES (4, 'user3', '123456', '3@qq.com', NULL, '用户3', NULL, NULL, 'USER', 0, 0, '2025-04-03 20:45:00',
        '2025-04-03 20:45:00', '2025-04-03 20:45:00');
INSERT INTO user
VALUES (5, 'user4', '123456', '4@qq.com', NULL, '用户4', NULL, NULL, 'USER', 0, 0, '2025-04-03 20:45:00',
        '2025-04-03 20:45:00', '2025-04-03 20:45:00');
INSERT INTO user
VALUES (6, 'user5', '123456', '5@qq.com', NULL, '用户5', NULL, NULL, 'USER', 0, 0, '2025-04-03 20:45:00',
        '2025-04-03 20:45:00', '2025-04-03 20:45:00');
INSERT INTO user
VALUES (7, 'user6', '123456', '6@qq.com', NULL, '用户6', NULL, NULL, 'USER', 0, 0, '2025-04-03 20:45:00',
        '2025-04-03 20:45:00', '2025-04-03 20:45:00');
INSERT INTO user
VALUES (8, 'user7', '123456', '7@qq.com', NULL, '用户7', NULL, NULL, 'USER', 0, 0, '2025-04-03 20:45:00',
        '2025-04-03 20:45:00', '2025-04-03 20:45:00');
INSERT INTO user
VALUES (9, 'user8', '123456', '8@qq.com', NULL, '用户8', NULL, NULL, 'USER', 0, 0, '2025-04-03 20:45:00',
        '2025-04-03 20:45:00', '2025-04-03 20:45:00');
INSERT INTO user
VALUES (10, 'user9', '123456', '9@qq.com', NULL, '用户9', NULL, NULL, 'USER', 0, 0, '2025-04-03 20:45:00',
        '2025-04-03 20:45:00', '2025-04-03 20:45:00');
INSERT INTO user
VALUES (11, 'user0', '123456', '0@qq.com', NULL, '用户', NULL, NULL, 'USER', 0, 0, '2025-04-03 20:45:00',
        '2025-04-03 20:45:00', '2025-04-03 20:45:00');

DROP TABLE IF EXISTS user_login_log;
CREATE TABLE user_login_log
(
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    user_id     BIGINT          NOT NULL COMMENT '用户ID',
    login_ip    VARCHAR(64)     NOT NULL COMMENT '登录IP',
    login_time  DATETIME        NOT NULL COMMENT '登录时间',
    user_agent  VARCHAR(256)    NULL     DEFAULT NULL COMMENT '登录设备信息',
    create_time DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci COMMENT = '用户登录日志表'
  ROW_FORMAT = DYNAMIC;

DROP TABLE IF EXISTS house_record;
CREATE TABLE house_record
(
    id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    square_footage          DECIMAL(12, 2)  NOT NULL COMMENT '房屋面积，单位Sq.Ft',
    bedrooms                INT             NOT NULL COMMENT '卧室数量',
    bathrooms               DECIMAL(3, 1)   NOT NULL COMMENT '浴室数量',
    year_built              INT             NOT NULL COMMENT '建造年份',
    lot_size                DECIMAL(12, 2)  NOT NULL COMMENT '土地面积',
    distance_to_city_center DECIMAL(10, 2)  NOT NULL COMMENT '距离市中心距离',
    school_rating           DECIMAL(4, 2)   NOT NULL COMMENT '学校评分',
    price                   DECIMAL(14, 2)  NOT NULL COMMENT '房屋价格',
    create_time             DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time             DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id) USING BTREE,
    INDEX idx_price (price ASC) USING BTREE,
    INDEX idx_square_footage (square_footage ASC) USING BTREE,
    INDEX idx_year_built (year_built ASC) USING BTREE,
    INDEX idx_bedrooms (bedrooms ASC) USING BTREE,
    INDEX idx_bathrooms (bathrooms ASC) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 51
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci COMMENT = '房屋记录表'
  ROW_FORMAT = DYNAMIC;

INSERT INTO house_record
    (id, square_footage, bedrooms, bathrooms, year_built, lot_size, distance_to_city_center, school_rating, price)
VALUES
    (1, 1250, 2, 1.0, 1985, 5200, 3.2, 7.1, 185000),
    (2, 1850, 3, 2.0, 1998, 7500, 5.6, 8.2, 265000),
    (3, 1420, 3, 2.0, 1992, 6800, 2.8, 6.9, 210000),
    (4, 2100, 4, 2.5, 2005, 9200, 7.3, 8.5, 345000),
    (5, 1700, 3, 2.0, 2001, 7100, 4.1, 7.8, 275000),
    (6, 980, 2, 1.0, 1978, 4500, 2.5, 6.5, 165000),
    (7, 2400, 4, 3.0, 2010, 10500, 8.2, 9.0, 410000),
    (8, 1600, 3, 1.5, 1995, 6700, 3.8, 7.2, 225000),
    (9, 2200, 4, 2.5, 2008, 9800, 6.9, 8.7, 375000),
    (10, 1350, 3, 1.0, 1987, 5800, 3.0, 7.0, 195000),
    (11, 1950, 3, 2.0, 2003, 8100, 5.2, 8.1, 285000),
    (12, 1100, 2, 1.0, 1982, 4800, 2.1, 6.8, 175000),
    (13, 2350, 4, 3.0, 2012, 10200, 7.8, 9.1, 400000),
    (14, 1550, 3, 1.5, 1994, 6500, 3.6, 7.3, 220000),
    (15, 2050, 4, 2.5, 2006, 9000, 6.7, 8.6, 355000),
    (16, 1300, 2, 1.0, 1986, 5500, 2.9, 7.2, 190000),
    (17, 1800, 3, 2.0, 1999, 7300, 4.9, 8.0, 260000),
    (18, 1150, 2, 1.0, 1980, 4600, 2.3, 6.7, 170000),
    (19, 2300, 4, 3.0, 2011, 10000, 7.5, 9.0, 395000),
    (20, 1500, 3, 1.5, 1993, 6400, 3.5, 7.4, 215000),
    (21, 1650, 3, 2.0, 1997, 7000, 4.0, 7.7, 240000),
    (22, 2150, 4, 2.5, 2007, 9500, 7.0, 8.8, 365000),
    (23, 1200, 2, 1.0, 1984, 5000, 2.6, 6.9, 180000),
    (24, 1900, 3, 2.0, 2002, 7800, 5.0, 8.3, 280000),
    (25, 1400, 3, 1.5, 1990, 6000, 3.2, 7.1, 205000),
    (26, 2250, 4, 3.0, 2009, 9900, 7.2, 8.9, 385000),
    (27, 1750, 3, 2.0, 2000, 7200, 4.5, 7.9, 255000),
    (28, 1050, 2, 1.0, 1979, 4400, 2.2, 6.6, 160000),
    (29, 2050, 4, 2.5, 2004, 8800, 6.5, 8.4, 335000),
    (30, 1450, 3, 1.5, 1991, 6200, 3.4, 7.5, 215000),
    (31, 1330, 2, 1.0, 1988, 5600, 3.1, 7.0, 195000),
    (32, 1870, 3, 2.0, 2000, 7600, 5.0, 8.1, 270000),
    (33, 1380, 3, 1.5, 1992, 6100, 3.2, 7.3, 205000),
    (34, 2120, 4, 2.5, 2006, 9300, 7.1, 8.6, 350000),
    (35, 1680, 3, 2.0, 1998, 7050, 4.2, 7.6, 250000),
    (36, 1010, 2, 1.0, 1980, 4550, 2.4, 6.7, 170000),
    (37, 2380, 4, 3.0, 2011, 10300, 7.9, 9.0, 405000),
    (38, 1580, 3, 1.5, 1996, 6650, 3.7, 7.2, 230000),
    (39, 2180, 4, 2.5, 2007, 9700, 6.8, 8.7, 370000),
    (40, 1270, 2, 1.0, 1985, 5300, 2.8, 7.0, 190000),
    (41, 1930, 3, 2.0, 2002, 8000, 5.3, 8.2, 290000),
    (42, 1120, 2, 1.0, 1983, 4850, 2.2, 6.9, 175000),
    (43, 2320, 4, 3.0, 2010, 10100, 7.7, 9.0, 390000),
    (44, 1520, 3, 1.5, 1995, 6350, 3.5, 7.4, 225000),
    (45, 2070, 4, 2.5, 2005, 9100, 6.6, 8.5, 345000),
    (46, 1290, 2, 1.0, 1986, 5400, 3.0, 7.1, 195000),
    (47, 1820, 3, 2.0, 1999, 7400, 4.8, 8.0, 265000),
    (48, 1130, 2, 1.0, 1981, 4700, 2.3, 6.8, 170000),
    (49, 2280, 4, 3.0, 2009, 9950, 7.4, 8.9, 385000),
    (50, 1480, 3, 1.5, 1992, 6300, 3.4, 7.5, 220000);
