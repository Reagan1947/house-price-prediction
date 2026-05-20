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
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci COMMENT = '房屋记录表'
  ROW_FORMAT = DYNAMIC;
