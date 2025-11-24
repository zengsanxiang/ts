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
const getCityDistricts = () => {
    let c = [];
    for (const element of city_1.default.city_data) {
        for (const district of element.district_list_data || []) {
            c.push({
                city: element.name,
                city_code: element.city_code,
                district: district.name,
                district_code: district.code,
            });
        }
    }
    return c;
};
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
let insertRepeat = 0;
let insertRepeatMax = 20;
async function getOrCreateRegion(name, nameCN, level, parentId = null) {
    if (!nameCN)
        return null;
    const [exist] = await db_1.db
        .select()
        .from(schema_1.regions)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.regions.name_cn, nameCN), (0, drizzle_orm_1.eq)(schema_1.regions.level, level)))
        .limit(1);
    if (exist)
        return exist.id;
    const id = (0, exports.nanoid)();
    await db_1.db.insert(schema_1.regions).values({
        id,
        // name: name,
        name_cn: nameCN,
        level,
        parentId,
    });
    return id;
}
const getLocations = async (district, refresh_index) => {
    try {
        const body = {
            filter_opt: {
                ...district,
                shoot_type: [],
            },
            count: 8,
            refresh_index: refresh_index,
            sort_type: "综合",
            switch_city: 0,
            sp_count: 4,
        };
        const query = {
            device_platform: "android",
            os: "android",
            ssmix: "a",
            _rticket: 1761995036728,
            cdid: "5436cf30-ef3e-464d-8df4-fd3b760efeca",
            channel: "tengxun_581895_64",
            aid: 581895,
            app_name: "sicily_cm",
            version_code: 3129,
            version_name: "15.5.0",
            manifest_version_code: 3129,
            update_version_code: 155009,
            resolution: "1440*2560",
            dpi: 480,
            device_type: "PHN110",
            device_brand: "OPPO",
            language: "zh",
            os_api: 32,
            os_version: 12,
            ac: "wifi",
            location_permission: 1,
            iid: 942694728283716,
            device_id: 942694728279620,
        };
        const res = await axios_1.default.post("https://api5-normal-sicily-hl.faceu.mobi/sicily/v2/poi/combine/list/", body, {
            params: query,
            timeout: 5000,
        });
        const data = res.data;
        let { poi_combine_list, has_more } = data;
        console.log(poi_combine_list.length, has_more, insertRepeat);
        //   console.log(poi_combine_list);
        for (let item of poi_combine_list) {
            let { poi_info } = item;
            const { id: o_id, name: name_cn, country_name: country, lbs_province: province, lbs_city: city, lbs_district: district, location_text: ad_cn, poi_latitude: lat, poi_longitude: lng, open_hours, open_status, } = poi_info;
            const countryId = await getOrCreateRegion("", country, "country");
            const provinceId = await getOrCreateRegion("", province, "province", countryId);
            const cityId = await getOrCreateRegion("", city, "city", provinceId);
            const districtId = await getOrCreateRegion("", district, "district", cityId);
            // 🏞️ 检查 location 是否已存在
            const [existLoc] = await db_1.db
                .select()
                .from(schema_1.locations)
                .where((0, drizzle_orm_1.eq)(schema_1.locations.o_id, o_id))
                .limit(1);
            if (existLoc) {
                insertRepeat++;
                continue;
            }
            // 🏠 插入新 location
            const locId = (0, exports.nanoid)();
            let p = await db_1.db.insert(schema_1.locations).values({
                o_id,
                id: locId,
                name_cn,
                ad_cn,
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                open_hours,
                open_status,
                regionId: districtId ?? cityId ?? provinceId ?? countryId,
            });
        }
        if (has_more && insertRepeat < insertRepeatMax) {
            await sleep(10000);
            console.log("cccc");
            await getLocations(district, refresh_index + 1);
        }
        else {
            insertRepeat = 0;
        }
    }
    catch (error) {
        console.error(error);
    }
};
const init = async () => {
    const districts = getCityDistricts().reverse();
    for (const district of districts) {
        console.log(district);
        await getLocations(district, 0);
    }
};
init().catch(console.error);
