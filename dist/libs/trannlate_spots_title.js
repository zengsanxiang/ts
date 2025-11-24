"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// 翻译景点描述
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const openai_1 = __importDefault(require("openai"));
const client = new openai_1.default({
    apiKey: "sk-svcZHZDhmpzaKQFNZ6WK4RSgatyNrte7v8AXUp2sP4yYQGMB", // 用环境变量，别硬编码
    baseURL: "https://api.moonshot.cn/v1", // ✅ 去掉末尾空格
});
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
const init = async () => {
    const list = await db_1.db.query.spots.findMany({
        where: (0, drizzle_orm_1.isNull)(schema_1.spots.title),
        orderBy: (0, drizzle_orm_1.asc)(schema_1.spots.c_at),
    });
    if (!list.length)
        return;
    for (const item of list) {
        // await sleep(1000); // 休息20秒，避免触发频率限制
        // const item = list[0]; // 只拿第一条演示
        // console.log(item);
        if (!item?.title_cn)
            continue; // 再兜底一次
        if (item?.title)
            continue; // 再兜底一次
        const completion = await client.chat.completions.create({
            model: "moonshot-v1-8k",
            messages: [
                {
                    role: "system",
                    content: "你是一个专业的旅游翻译，将中文翻译为英文。符合美国人的翻译习惯，只给翻译结果，不要有其他解释。",
                },
                { role: "user", content: item.title_cn },
            ],
            temperature: 0.6,
        });
        // console.log(completion);
        // 安全取值
        const content = completion.choices[0]?.message?.content;
        if (content) {
            // console.log(content)
            await db_1.db
                .update(schema_1.spots)
                .set({ title: content })
                .where((0, drizzle_orm_1.eq)(schema_1.spots.id, item.id));
        }
    }
};
init().catch(console.error);
