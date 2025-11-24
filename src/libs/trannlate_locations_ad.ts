// 翻译景点描述
import { db } from "../db";
import { locations } from "../db/schema";
import { isNull, eq, asc } from "drizzle-orm";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-svcZHZDhmpzaKQFNZ6WK4RSgatyNrte7v8AXUp2sP4yYQGMB", // 用环境变量，别硬编码
  baseURL: "https://api.moonshot.cn/v1", // ✅ 去掉末尾空格
});
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const init = async () => {
  const list = await db.query.locations.findMany({
    where: isNull(locations.ad),
    orderBy: asc(locations.c_at),
  });
  if (!list.length) return;
  for (const item of list) {
    // await sleep(1000); // 休息20秒，避免触发频率限制
    // const item = list[0]; // 只拿第一条演示
    // console.log(item);
    console.log("开始翻译地点地址", item?.ad_cn);
    if (!item?.ad_cn) continue; // 再兜底一次
    if (item?.ad) continue; // 再兜底一次
    const completion = await client.chat.completions.create({
      model: "moonshot-v1-8k",
      messages: [
        {
          role: "system",
          content:
            "你是一个专业的旅游翻译，将中文翻译为英文。符合美国人的翻译习惯，只给翻译结果，不要有其他解释。",
        },
        { role: "user", content: item.ad_cn },
      ],
      temperature: 0.6,
    });
    // console.log(completion);
    // 安全取值
    const content = completion.choices[0]?.message?.content;
    if (content) {
      // console.log(content)
      await db
        .update(locations)
        .set({ ad: content })
        .where(eq(locations.id, item.id));
    }
  }
};

init().catch(console.error);
