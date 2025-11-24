import { customAlphabet } from "nanoid";
import {
  pgTable,
  varchar,
  text,
  timestamp,
  doublePrecision,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const nanoid = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyz",
  21
);

/**
 * 🌍 地区表
 */
export const regions = pgTable("regions", {
  id: varchar("id", { length: 21 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  parentId: varchar("parent_id", { length: 21 }).references(() => regions.id, {
    onDelete: "cascade",
  }),

  /** 英文名，如“Guangdong”、“Guangzhou” */
  name: varchar("name", { length: 100 }),
  /** 名称，如“广东省”、“广州市”、“天河区” */
  name_cn: varchar("name_cn", { length: 100 }).notNull(),
  code: varchar("code", { length: 50 }).unique(),
  level: varchar("level", {
    length: 30,
  }).notNull() /** 层级类型，如 country / province / city / district / town / street / poi 等 */,
  c_at: timestamp("c_at").defaultNow(),
  u_at: timestamp("u_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
  d: boolean("d").default(false),
});

/**
 * 📍 拍摄地点表
 */
export const locations = pgTable("locations", {
  o_id: varchar("o_id", { length: 19 }),
  id: varchar("id", { length: 21 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: varchar("name", { length: 255 }),
  name_cn: varchar("name_cn", { length: 255 }).notNull(),
  open_hours: varchar("open_hours", { length: 30 }),
  open_status: varchar("open_status", { length: 1 }),

  regionId: varchar("region_id", { length: 21 }).references(() => regions.id, {
    onDelete: "set null",
  }),
  ad: varchar("ad", { length: 180 }),
  ad_cn: varchar("ad_cn", { length: 180 }),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  // desc: text("desc"),
  c_at: timestamp("c_at").defaultNow(),
  u_at: timestamp("u_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
  d: boolean("d").default(false),
  g_place_id: varchar("g_place_id", { length: 50 }).unique(),
  // 高德地图
  a_poi_id: varchar("a_poi_id", { length: 50 }).unique(),
});

/**
 * 📸 机位表
 */
export const spots = pgTable("spots", {
  o_id: varchar("o_id", { length: 19 }),
  id: varchar("id", { length: 21 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  location_id: varchar("location_id", { length: 21 }).references(
    () => locations.id,
    { onDelete: "cascade" }
  ),
  title: varchar("title", { length: 255 }),
  title_cn: varchar("title_cn", { length: 255 }).notNull(),
  desc: varchar("desc", { length: 2000 }),
  desc_cn: varchar("desc_cn", { length: 600 }),
  img: varchar("img", { length: 500 }),
  // tips: text("tips"),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  ad: varchar("ad", { length: 180 }),
  ad_cn: varchar("ad_cn", { length: 180 }),
  // bestTime: varchar("best_time", { length: 100 }),
  c_at: timestamp("c_at").defaultNow(),
  u_at: timestamp("u_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
  d: boolean("d").default(false),
});

/**
 * 🖼️ 机位图片表
 */
export const spotPhotos = pgTable("spot_photos", {
  id: varchar("id", { length: 21 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  spotId: varchar("spot_id", { length: 21 }).references(() => spots.id, {
    onDelete: "cascade",
  }),
  img: varchar("img", { length: 500 }).notNull(),
  desc: varchar("desc", { length: 600 }),
  desc_cn: varchar("desc_cn", { length: 600 }),
  c_at: timestamp("c_at").defaultNow(),
  u_at: timestamp("u_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
  d: boolean("d").default(false),
});
/**
 * 🖼️ 机位步行引导
 */
export const spotWalkingGuides = pgTable("spot_walking_guides", {
  id: varchar("id", { length: 21 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  spotId: varchar("spot_id", { length: 21 }).references(() => spots.id, {
    onDelete: "cascade",
  }),
  img: varchar("img", { length: 500 }),
  order: integer("order").default(0),
  desc: varchar("desc", { length: 600 }),
  desc_cn: varchar("desc_cn", { length: 600 }),
  c_at: timestamp("c_at").defaultNow(),
  u_at: timestamp("u_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
  d: boolean("d").default(false),
});
/**
 * ⭐ 用户评价表
 */
export const spotReviews = pgTable("spot_reviews", {
  id: varchar("id", { length: 21 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  spotId: varchar("spot_id", { length: 21 }).references(() => spots.id, {
    onDelete: "cascade",
  }),
  rating: integer("rating").default(5),
  desc: varchar("desc", { length: 600 }),
  desc_cn: varchar("desc_cn", { length: 600 }),
  c_at: timestamp("c_at").defaultNow(),
  u_at: timestamp("u_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
  d: boolean("d").default(false),
});

/**
 * 🔗 表关系定义
 */
export const regionRelations = relations(regions, ({ many }) => ({
  locations: many(locations),
}));

export const locationRelations = relations(locations, ({ one, many }) => ({
  region: one(regions, {
    fields: [locations.regionId],
    references: [regions.id],
  }),
  spots: many(spots),
}));

export const spotRelations = relations(spots, ({ one, many }) => ({
  location: one(locations, {
    fields: [spots.location_id],
    references: [locations.id],
  }),
  photos: many(spotPhotos),
  reviews: many(spotReviews),
  walkingguides: many(spotWalkingGuides),
}));

export const spotPhotoRelations = relations(spotPhotos, ({ one }) => ({
  spot: one(spots, {
    fields: [spotPhotos.spotId],
    references: [spots.id],
  }),
}));
/**
 * 🖼️ 机位步行引导关系
 */
export const spotWalkingGuideRelations = relations(
  spotWalkingGuides,
  ({ one }) => ({
    spot: one(spots, {
      fields: [spotWalkingGuides.spotId],
      references: [spots.id],
    }),
  })
);
export const spotReviewRelations = relations(spotReviews, ({ one }) => ({
  spot: one(spots, {
    fields: [spotReviews.spotId],
    references: [spots.id],
  }),
}));
