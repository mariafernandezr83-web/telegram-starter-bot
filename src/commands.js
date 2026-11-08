
import { InlineKeyboard } from "grammy"

export function registerCommands(bot) {
  bot.command("start", (ctx) =>
    ctx.reply(
      `Hola ${ctx.from?.first_name ?? "amigo"}. Estoy funcionando en FadeHost.\n\nUsa /help para ver mis comandos.`
    )
  )

  bot.command("help", (ctx) =>
    ctx.reply(
      [
        "COMANDOS DEL BOT:",
        "",
        "/start - Iniciar el bot",
        "/help - Ver comandos",
        "/ping - Comprobar funcionamiento",
        "/id - Ver identificadores",
        "/buscar producto - Buscar en Amazon",
        "/amazon producto - Buscar en Amazon",
      ].join("\n")
    )
  )

  bot.command("ping", (ctx) => ctx.reply("pong"))

  bot.command("id", (ctx) =>
    ctx.reply(`Chat id: ${ctx.chat.id}\nYour id: ${ctx.from?.id ?? "unknown"}`)
  )

  async function buscarAmazon(ctx) {
    const producto = ctx.match?.trim()

    if (!producto) {
      return ctx.reply("Escribe qué producto quieres buscar.\nEjemplo: /buscar iPhone 17")
    }

    const url = "https://www.amazon.es/s?k=" + encodeURIComponent(producto)

    const keyboard = new InlineKeyboard()
      .url("🔎 Buscar en Amazon España", url)

    return ctx.reply(
      `🔍 Búsqueda en Amazon España\n\nProducto: ${producto}\n\nAbre el botón para consultar los resultados.`,
      { reply_markup: keyboard }
    )
  }

  bot.command("buscar", buscarAmazon)
  bot.command("amazon", buscarAmazon)

  bot.callbackQuery("ping", (ctx) =>
    ctx.answerCallbackQuery({ text: "pong" })
  )

  bot.on("message:text", (ctx) => ctx.reply(ctx.message.text))
}
