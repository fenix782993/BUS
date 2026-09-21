import os
import asyncio

from aiogram import (
    Bot,
    Dispatcher,
    Router
)

from aiogram.filters import (
    CommandStart,
    Command
)

from aiogram.types import (
    Message,
    InlineKeyboardMarkup,
    InlineKeyboardButton
)


router = Router()


def city_button():

    url = os.getenv(
        "MINI_APP_URL",
        "https://example.com"
    )

    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🌆 ОТКРЫТЬ FENIX CITY",
                    url=url
                )
            ]
        ]
    )


@router.message(
    CommandStart()
)
async def start(
    message: Message
):

    await message.answer(
        (
            "🔥 <b>FENIX CITY</b>\n\n"
            "Добро пожаловать в город.\n\n"
            "Здесь ты можешь:\n"
            "💰 зарабатывать\n"
            "🏠 покупать недвижимость\n"
            "🚗 собирать транспорт\n"
            "📈 следить за экономикой\n"
            "🏆 соревноваться с игроками\n"
            "⚡ участвовать в событиях\n\n"
            "Город работает 24/7."
        ),
        reply_markup=city_button(),
        parse_mode="HTML"
    )


@router.message(
    Command("profile")
)
async def profile(
    message: Message
):

    await message.answer(
        (
            "👤 <b>FENIX CITY</b>\n\n"
            f"Telegram ID:\n"
            f"<code>{message.from_user.id}</code>\n\n"
            "Открой город для полного профиля."
        ),
        reply_markup=city_button(),
        parse_mode="HTML"
    )


@router.message(
    Command("help")
)
async def help_command(
    message: Message
):

    await message.answer(
        (
            "<b>КОМАНДЫ</b>\n\n"
            "/start — открыть город\n"
            "/profile — профиль\n"
            "/help — помощь"
        ),
        parse_mode="HTML"
    )


async def main():

    token = os.getenv(
        "BOT_TOKEN"
    )

    if not token:

        print(
            "BOT_TOKEN не установлен."
        )

        while True:

            await asyncio.sleep(
                3600
            )

    bot = Bot(
        token=token
    )

    dp = Dispatcher()

    dp.include_router(
        router
    )

    print(
        "🔥 FENIX CITY BOT ONLINE"
    )

    await dp.start_polling(
        bot
    )


if __name__ == "__main__":

    asyncio.run(
        main()
    )