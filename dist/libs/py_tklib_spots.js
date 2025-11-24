"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nanoid = void 0;
// 翻译景点描述
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const axios_1 = __importDefault(require("axios"));
const city_1 = __importDefault(require("../datas/city"));
const nanoid_1 = require("nanoid");
exports.nanoid = (0, nanoid_1.customAlphabet)("0123456789abcdefghijklmnopqrstuvwxyz", 21);
/* --------------------------- utils --------------------------- */
const getCityDistricts = () => {
    return city_1.default.city_data.flatMap((element) => (element.district_list_data || []).map((district) => ({
        city: element.name,
        city_code: element.city_code,
        district: district.name,
        district_code: district.code,
    })));
};
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
const getRegionIdByDistrict = async (name_cn) => {
    const [region] = await db_1.db
        .select()
        .from(schema_1.regions)
        .where((0, drizzle_orm_1.eq)(schema_1.regions.name_cn, name_cn))
        .limit(1);
    return region?.id;
};
const getLocationsByregionId = async (regionId) => {
    if (!regionId)
        return [];
    return db_1.db.query.locations.findMany({
        where: (0, drizzle_orm_1.eq)(schema_1.locations.regionId, regionId),
    });
};
function getImageURL(list) {
    return list?.[0]?.url_list?.slice(-1)?.[0] ?? "";
}
/** worker: image URL → base64 */
async function loadImageBase64(imageurl, id, path) {
    try {
        const res = await axios_1.default.post(`https://jjj.tklib.com/api/ks/loadImage`, { imageurl, id, path });
        return res.data?.data ?? "";
    }
    catch (err) {
        console.error("loadImageBase64", err);
        return "";
    }
}
/* --------------------------- main handlers --------------------------- */
const handlePositionItem = async (item, location_id) => {
    try {
        const { id, name, shoot_suggest, origin_cover_url_list_large, location_info, guide_list = [], } = item;
        const { location_text, poi_latitude, poi_longitude } = location_info ?? {};
        console.log("开始整理打卡地点数据", item.id);
        const imageurl = getImageURL(origin_cover_url_list_large);
        const base64 = await loadImageBase64(imageurl, id, "i");
        const guides = [];
        for (const guide of guide_list) {
            const guide_img = guide?.guide_image?.url_list?.slice(-1)?.[0] ?? "";
            let guide_base64 = "";
            if (guide_img) {
                guide_base64 = await loadImageBase64(guide_img, id, "g");
            }
            guides.push({
                desc_cn: guide?.guide_text ?? "",
                img: guide_base64,
            });
        }
        const spotData = {
            o_id: id,
            location_id,
            title_cn: name,
            desc_cn: shoot_suggest?.suggest_text,
            img: base64,
            ad_cn: location_text,
            lat: poi_latitude ? parseFloat(poi_latitude) : null,
            lng: poi_longitude ? parseFloat(poi_longitude) : null,
        };
        console.log("开始存入打卡地点数据", item.id);
        const [newSpot] = await db_1.db
            .insert(schema_1.spots)
            .values(spotData)
            .returning({ id: schema_1.spots.id });
        console.log("newSpot", newSpot);
        if (guides.length) {
            await db_1.db.insert(schema_1.spotWalkingGuides).values(guides.map((g) => ({
                spotId: newSpot.id,
                img: g.img ?? "",
                desc_cn: g.desc_cn ?? "",
            })));
        }
    }
    catch (error) {
        console.error("存入打卡地点数据失败", error);
    }
};
const handlePositionList = async (position_list, location_id) => {
    console.log("获取到地址打卡数据考试循环");
    for (const item of position_list) {
        const existing = await db_1.db.query.spots.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.spots.o_id, item.id),
        });
        // console.log("existing", existing);
        if (existing?.length) {
            console.log("打卡地点已存在，跳过", item.id);
            continue;
        }
        await handlePositionItem(item, location_id);
    }
};
const getSpotsByLocation = async (location, cursor) => {
    const resp = await axios_1.default.get(`https://api5-normal-sicily-hl.faceu.mobi/sicily/v2/poi/combine/detail/`, {
        params: {
            poi_id: location.o_id,
            cursor,
            count: "8",
            content_type: "0",
            need_content: "1",
            device_platform: "android",
            os: "android",
            language: "zh",
        },
    });
    console.log("获取到地址打卡数据");
    const { position_list = [], next_cursor = 0, has_more = false, } = resp.data ?? {};
    // console.log("position_list", position_list);
    await handlePositionList(position_list, location.id);
    if (has_more) {
        console.log("获取到打卡数据更多数据，开始递归", next_cursor);
        setTimeout(() => getSpotsByLocation(location, next_cursor), 3000);
    }
};
// const init = async () => {
//   const districts = getCityDistricts();
//   for (const district of districts) {
//     const regionId = await getRegionIdByDistrict(district.district);
//     if (!regionId) continue;
//     console.log("获取到区域", district, regionId);
//     const locationList = await getLocationsByregionId(regionId);
//     console.log("获取到区域地址，开始循环", regionId);
//     for (const location of locationList) {
//       await getSpotsByLocation(location, 0);
//     }
//   }
// };
const init = async () => {
    // const locationList = await db.query.locations.findMany({});
    // console.log("获取到所有地址，开始循环");
    const unusedLocations = await db_1.db
        .select()
        .from(schema_1.locations)
        .where((0, drizzle_orm_1.notInArray)(schema_1.locations.id, db_1.db
        .select({ location_id: schema_1.spots.location_id })
        .from(schema_1.spots)
        .where((0, drizzle_orm_1.isNotNull)(schema_1.spots.location_id))));
    console.log("获取到未使用地址", unusedLocations.length);
    // return;
    // console.log("获取到未使用地址", unusedLocations);
    for (const location of unusedLocations) {
        console.log("获取到地址打卡数据", location);
        const existing = await db_1.db.query.spots.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.spots.location_id, location.id),
        });
        if (existing?.length) {
            console.log("地址打卡数据已存在，跳过", location.id);
            continue;
        }
        await getSpotsByLocation(location, 0);
    }
};
init().catch(console.error);
