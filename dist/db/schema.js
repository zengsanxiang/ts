"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spotReviewRelations = exports.spotWalkingGuideRelations = exports.spotPhotoRelations = exports.spotRelations = exports.locationRelations = exports.regionRelations = exports.spotReviews = exports.spotWalkingGuides = exports.spotPhotos = exports.spots = exports.locations = exports.regions = exports.nanoid = void 0;
const nanoid_1 = require("nanoid");
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.nanoid = (0, nanoid_1.customAlphabet)("0123456789abcdefghijklmnopqrstuvwxyz", 21);
/**
 * 🌍 地区表
 */
exports.regions = (0, pg_core_1.pgTable)("regions", {
    id: (0, pg_core_1.varchar)("id", { length: 21 })
        .primaryKey()
        .$defaultFn(() => (0, exports.nanoid)()),
    parentId: (0, pg_core_1.varchar)("parent_id", { length: 21 }).references(() => exports.regions.id, {
        onDelete: "cascade",
    }),
    /** 英文名，如“Guangdong”、“Guangzhou” */
    name: (0, pg_core_1.varchar)("name", { length: 100 }),
    /** 名称，如“广东省”、“广州市”、“天河区” */
    name_cn: (0, pg_core_1.varchar)("name_cn", { length: 100 }).notNull(),
    code: (0, pg_core_1.varchar)("code", { length: 50 }).unique(),
    level: (0, pg_core_1.varchar)("level", {
        length: 30,
    }).notNull() /** 层级类型，如 country / province / city / district / town / street / poi 等 */,
    c_at: (0, pg_core_1.timestamp)("c_at").defaultNow(),
    u_at: (0, pg_core_1.timestamp)("u_at")
        .defaultNow()
        .$onUpdate(() => new Date()),
    d: (0, pg_core_1.boolean)("d").default(false),
});
/**
 * 📍 拍摄地点表
 */
exports.locations = (0, pg_core_1.pgTable)("locations", {
    o_id: (0, pg_core_1.varchar)("o_id", { length: 19 }),
    id: (0, pg_core_1.varchar)("id", { length: 21 })
        .primaryKey()
        .$defaultFn(() => (0, exports.nanoid)()),
    name: (0, pg_core_1.varchar)("name", { length: 255 }),
    name_cn: (0, pg_core_1.varchar)("name_cn", { length: 255 }).notNull(),
    open_hours: (0, pg_core_1.varchar)("open_hours", { length: 30 }),
    open_status: (0, pg_core_1.varchar)("open_status", { length: 1 }),
    regionId: (0, pg_core_1.varchar)("region_id", { length: 21 }).references(() => exports.regions.id, {
        onDelete: "set null",
    }),
    ad: (0, pg_core_1.varchar)("ad", { length: 180 }),
    ad_cn: (0, pg_core_1.varchar)("ad_cn", { length: 180 }),
    lat: (0, pg_core_1.doublePrecision)("lat").notNull(),
    lng: (0, pg_core_1.doublePrecision)("lng").notNull(),
    // desc: text("desc"),
    c_at: (0, pg_core_1.timestamp)("c_at").defaultNow(),
    u_at: (0, pg_core_1.timestamp)("u_at")
        .defaultNow()
        .$onUpdate(() => new Date()),
    d: (0, pg_core_1.boolean)("d").default(false),
    g_place_id: (0, pg_core_1.varchar)("g_place_id", { length: 50 }).unique(),
    // 高德地图
    a_poi_id: (0, pg_core_1.varchar)("a_poi_id", { length: 50 }).unique(),
});
/**
 * 📸 机位表
 */
exports.spots = (0, pg_core_1.pgTable)("spots", {
    o_id: (0, pg_core_1.varchar)("o_id", { length: 19 }),
    id: (0, pg_core_1.varchar)("id", { length: 21 })
        .primaryKey()
        .$defaultFn(() => (0, exports.nanoid)()),
    location_id: (0, pg_core_1.varchar)("location_id", { length: 21 }).references(() => exports.locations.id, { onDelete: "cascade" }),
    title: (0, pg_core_1.varchar)("title", { length: 255 }),
    title_cn: (0, pg_core_1.varchar)("title_cn", { length: 255 }).notNull(),
    desc: (0, pg_core_1.varchar)("desc", { length: 2000 }),
    desc_cn: (0, pg_core_1.varchar)("desc_cn", { length: 600 }),
    img: (0, pg_core_1.varchar)("img", { length: 500 }),
    // tips: text("tips"),
    lat: (0, pg_core_1.doublePrecision)("lat").notNull(),
    lng: (0, pg_core_1.doublePrecision)("lng").notNull(),
    ad: (0, pg_core_1.varchar)("ad", { length: 180 }),
    ad_cn: (0, pg_core_1.varchar)("ad_cn", { length: 180 }),
    // bestTime: varchar("best_time", { length: 100 }),
    c_at: (0, pg_core_1.timestamp)("c_at").defaultNow(),
    u_at: (0, pg_core_1.timestamp)("u_at")
        .defaultNow()
        .$onUpdate(() => new Date()),
    d: (0, pg_core_1.boolean)("d").default(false),
});
/**
 * 🖼️ 机位图片表
 */
exports.spotPhotos = (0, pg_core_1.pgTable)("spot_photos", {
    id: (0, pg_core_1.varchar)("id", { length: 21 })
        .primaryKey()
        .$defaultFn(() => (0, exports.nanoid)()),
    spotId: (0, pg_core_1.varchar)("spot_id", { length: 21 }).references(() => exports.spots.id, {
        onDelete: "cascade",
    }),
    img: (0, pg_core_1.varchar)("img", { length: 500 }).notNull(),
    desc: (0, pg_core_1.varchar)("desc", { length: 600 }),
    desc_cn: (0, pg_core_1.varchar)("desc_cn", { length: 600 }),
    c_at: (0, pg_core_1.timestamp)("c_at").defaultNow(),
    u_at: (0, pg_core_1.timestamp)("u_at")
        .defaultNow()
        .$onUpdate(() => new Date()),
    d: (0, pg_core_1.boolean)("d").default(false),
});
/**
 * 🖼️ 机位步行引导
 */
exports.spotWalkingGuides = (0, pg_core_1.pgTable)("spot_walking_guides", {
    id: (0, pg_core_1.varchar)("id", { length: 21 })
        .primaryKey()
        .$defaultFn(() => (0, exports.nanoid)()),
    spotId: (0, pg_core_1.varchar)("spot_id", { length: 21 }).references(() => exports.spots.id, {
        onDelete: "cascade",
    }),
    img: (0, pg_core_1.varchar)("img", { length: 500 }),
    order: (0, pg_core_1.integer)("order").default(0),
    desc: (0, pg_core_1.varchar)("desc", { length: 600 }),
    desc_cn: (0, pg_core_1.varchar)("desc_cn", { length: 600 }),
    c_at: (0, pg_core_1.timestamp)("c_at").defaultNow(),
    u_at: (0, pg_core_1.timestamp)("u_at")
        .defaultNow()
        .$onUpdate(() => new Date()),
    d: (0, pg_core_1.boolean)("d").default(false),
});
/**
 * ⭐ 用户评价表
 */
exports.spotReviews = (0, pg_core_1.pgTable)("spot_reviews", {
    id: (0, pg_core_1.varchar)("id", { length: 21 })
        .primaryKey()
        .$defaultFn(() => (0, exports.nanoid)()),
    spotId: (0, pg_core_1.varchar)("spot_id", { length: 21 }).references(() => exports.spots.id, {
        onDelete: "cascade",
    }),
    rating: (0, pg_core_1.integer)("rating").default(5),
    desc: (0, pg_core_1.varchar)("desc", { length: 600 }),
    desc_cn: (0, pg_core_1.varchar)("desc_cn", { length: 600 }),
    c_at: (0, pg_core_1.timestamp)("c_at").defaultNow(),
    u_at: (0, pg_core_1.timestamp)("u_at")
        .defaultNow()
        .$onUpdate(() => new Date()),
    d: (0, pg_core_1.boolean)("d").default(false),
});
/**
 * 🔗 表关系定义
 */
exports.regionRelations = (0, drizzle_orm_1.relations)(exports.regions, ({ many }) => ({
    locations: many(exports.locations),
}));
exports.locationRelations = (0, drizzle_orm_1.relations)(exports.locations, ({ one, many }) => ({
    region: one(exports.regions, {
        fields: [exports.locations.regionId],
        references: [exports.regions.id],
    }),
    spots: many(exports.spots),
}));
exports.spotRelations = (0, drizzle_orm_1.relations)(exports.spots, ({ one, many }) => ({
    location: one(exports.locations, {
        fields: [exports.spots.location_id],
        references: [exports.locations.id],
    }),
    photos: many(exports.spotPhotos),
    reviews: many(exports.spotReviews),
    walkingguides: many(exports.spotWalkingGuides),
}));
exports.spotPhotoRelations = (0, drizzle_orm_1.relations)(exports.spotPhotos, ({ one }) => ({
    spot: one(exports.spots, {
        fields: [exports.spotPhotos.spotId],
        references: [exports.spots.id],
    }),
}));
/**
 * 🖼️ 机位步行引导关系
 */
exports.spotWalkingGuideRelations = (0, drizzle_orm_1.relations)(exports.spotWalkingGuides, ({ one }) => ({
    spot: one(exports.spots, {
        fields: [exports.spotWalkingGuides.spotId],
        references: [exports.spots.id],
    }),
}));
exports.spotReviewRelations = (0, drizzle_orm_1.relations)(exports.spotReviews, ({ one }) => ({
    spot: one(exports.spots, {
        fields: [exports.spotReviews.spotId],
        references: [exports.spots.id],
    }),
}));
