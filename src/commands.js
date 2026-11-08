
import { InlineKeyboard } from "grammy"

export function registerCommands(bot) {
  bot.command("start", (ctx) =>
    ctx.reply(
      "¡Bienvenido! Soy tu detector de posibles errores de precio de Amazon España.\n\nUsa /buscar para buscar ofertas.",
      { reply_markup: new InlineKeyboard().text("Buscar ofertas 🔎", "buscar") }
    )
  )

  bot.command("help", (ctx) =>
    ctx.reply(
      "COMANDOS\n\n/start - Iniciar\n/buscar - Buscar posibles errores de precio\n/buscar samsung - Buscar por palabra\n/ping - Comprobar el bot\n/id - Ver identificadores"
    )
  )

  bot.command("ping", (ctx) => ctx.reply("Bot funcionando correctamente ✅"))

  bot.command("id", (ctx) =>
    ctx.reply(`Chat ID: ${ctx.chat.id}\nUser ID: ${ctx.from?.id}`)
  )

  bot.callbackQuery("buscar", async (ctx) => {
    await ctx.answerCallbackQuery()
    await buscarOfertas(ctx)
  })

  bot.command("buscar", async (ctx) => {
    await buscarOfertas(ctx, ctx.match?.trim() || "")
  })

  async function buscarOfertas(ctx, keyword = "") {
    const apiKey = process.env.KEEPA_API_KEY

    if (!apiKey) {
      return ctx.reply("Falta configurar KEEPA_API_KEY en FadeHost.")
    }

    await ctx.reply("🔎 Buscando posibles errores de precio en Amazon España...")

    try {
      const query = {
        page: 0,
        domainId: 9,
        priceTypes: [0],
        dateRange: 3,
        isRangeEnabled: true,
        deltaPercentRange: [50, 1000],
        sortType: 4,
        filterErotic: true,
        singleVariation: true
      }

      if (keyword) query.titleSearch = keyword

      const response = await fetch(
        `https://api.keepa.com/deal?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(query),
          signal: AbortSignal.timeout(30000)
        }
      )

      if (!response.ok) {
        throw new Error(`Keepa HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message || "Error de Keepa")
      }

      const deals = data.deals?.dr || []

      const candidates = deals.filter((item) => {
        const price = item.current?.[0]
        const average = item.avg?.[3]?.[0]
        const discount = item.deltaPercent?.[3]?.[0]

        return (
          price > 0 &&
          average > 0 &&
          discount >= 50
        )
      }).slice(0, 8)

      if (!candidates.length) {
        return ctx.reply(
          "No he encontrado ofertas que cumplan el filtro del 50%.\n\nPrueba de nuevo más tarde o utiliza /buscar con otra palabra."
        )
      }

      for (const item of candidates) {
        const price = item.current[0] / 100
        const average = item.avg[3][0] / 100
        const discount = item.deltaPercent[3][0]

        const message =
          `🚨 POSIBLE ERROR DE PRECIO\n\n` +
          `📦 ${item.title}\n\n` +
          `💰 Precio actual: ${price.toFixed(2)} €\n` +
          `📊 Media de 90 días: ${average.toFixed(2)} €\n` +
          `🔥 Diferencia: ${discount}%\n\n` +
          `🛒 https://www.amazon.es/dp/${item.asin}\n\n` +
          `⚠️ Precio pendiente de verificar en Amazon.`

        await ctx.reply(message, {
          link_preview_options: { is_disabled: true }
        })
      }

      console.log(
        `[Amazon] Encontradas ${candidates.length} posibles ofertas. Tokens restantes: ${data.tokensLeft}`
      )

    } catch (error) {
      console.error("[Amazon/Keepa]", error)
      await ctx.reply(
        "❌ Error al consultar Amazon mediante Keepa. Revisa la consola de FadeHost."
      )
    }
  }
}
