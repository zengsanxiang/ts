// 翻译景点描述
import { db } from "../db";
import {
  locations,
  regions,
  spots,
  spotReviews,
  spotPhotos,
  spotWalkingGuides,
} from "../db/schema";
import { eq, isNotNull, notInArray } from "drizzle-orm";
import axios from "axios";
import city from "../datas/city";
import { customAlphabet } from "nanoid";
interface LocationItem {
  o_id: string;
  id: number;
  name_cn: string;
}
export const nanoid = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyz",
  21
);

/* ---------------------------  types  --------------------------- */

interface GuideItem {
  guide_text?: string;
  guide_image?: {
    url_list?: string[];
  };
}

interface PositionItem {
  id: string;
  name: string;
  shoot_suggest?: { suggest_text?: string };
  origin_cover_url_list_large?: Array<{ url_list?: string[] }>;
  location_info: {
    location_text?: string;
    poi_latitude?: number | string;
    poi_longitude?: number | string;
  };
  guide_list?: GuideItem[];
}

interface GetSpotsResult {
  position_list: PositionItem[];
  next_cursor: number;
  has_more: boolean;
}

/* --------------------------- utils --------------------------- */

const getCityDistricts = () => {
  return city.city_data.flatMap((element: any) =>
    (element.district_list_data || []).map((district: any) => ({
      city: element.name,
      city_code: element.city_code,
      district: district.name,
      district_code: district.code,
    }))
  );
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const getRegionIdByDistrict = async (name_cn: string) => {
  const [region] = await db
    .select()
    .from(regions)
    .where(eq(regions.name_cn, name_cn))
    .limit(1);

  return region?.id;
};

const getLocationsByregionId = async (regionId: string) => {
  if (!regionId) return [];
  return db.query.locations.findMany({
    where: eq(locations.regionId, regionId),
  });
};

function getImageURL(list?: PositionItem["origin_cover_url_list_large"]) {
  return list?.[0]?.url_list?.slice(-1)?.[0] ?? "";
}

/** worker: image URL → base64 */
async function loadImageBase64(
  imageurl: string,
  id: string,
  path: string
): Promise<string> {
  try {
    const res = await axios.post(
      `https://jjj.tklib.com/api/ks/loadImage`,
      { imageurl, id, path }
    );
    return res.data?.data ?? "";
  } catch (err) {
    console.error("loadImageBase64", err);
    return "";
  }
}

/* --------------------------- main handlers --------------------------- */

const handlePositionItem = async (item: PositionItem, location_id: string) => {
  try {
    const {
      id,
      name,
      shoot_suggest,
      origin_cover_url_list_large,
      location_info,
      guide_list = [],
    } = item;

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
      lat: poi_latitude ? parseFloat(poi_latitude as any) : null,
      lng: poi_longitude ? parseFloat(poi_longitude as any) : null,
    };
    console.log("开始存入打卡地点数据", item.id);
    const [newSpot] = await db
      .insert(spots)
      .values(spotData as any)
      .returning({ id: spots.id });
    console.log("newSpot", newSpot);
    if (guides.length) {
      await db.insert(spotWalkingGuides).values(
        guides.map((g) => ({
          spotId: newSpot.id,
          img: g.img ?? "",
          desc_cn: g.desc_cn ?? "",
        }))
      );
    }
  } catch (error) {
    console.error("存入打卡地点数据失败", error);
  }
};

const handlePositionList = async (
  position_list: PositionItem[],
  location_id: string
) => {
  console.log("获取到地址打卡数据考试循环");
  for (const item of position_list) {
    const existing = await db.query.spots.findMany({
      where: eq(spots.o_id, item.id),
    });
    // console.log("existing", existing);
    if (existing?.length) {
      console.log("打卡地点已存在，跳过", item.id);
      continue;
    }

    await handlePositionItem(item, location_id);
  }
};

const getSpotsByLocation = async (location: any, cursor: number) => {
  const resp = await axios.get<GetSpotsResult>(
    `https://api5-normal-sicily-hl.faceu.mobi/sicily/v2/poi/combine/detail/`,
    {
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
    }
  );
  console.log("获取到地址打卡数据");
  const {
    position_list = [],
    next_cursor = 0,
    has_more = false,
  } = resp.data ?? {};
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
  const unusedLocations = await db
    .select()
    .from(locations)
    .where(
      notInArray(
        locations.id,
        db
          .select({ location_id: spots.location_id })
          .from(spots)
          .where(isNotNull(spots.location_id))
      )
    );
  console.log("获取到未使用地址", unusedLocations.length);
  // return;
  // console.log("获取到未使用地址", unusedLocations);
  for (const location of unusedLocations) {
    console.log("获取到地址打卡数据", location);
    const existing = await db.query.spots.findMany({
      where: eq(spots.location_id, location.id),
    });
    if (existing?.length) {
      console.log("地址打卡数据已存在，跳过", location.id);
      continue;
    }
    await getSpotsByLocation(location, 0);
  }
};
init().catch(console.error);
