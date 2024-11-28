---
title: Python实现Telegram自动签到脚本
description: 利用 Python 实现简易 Telegram 自动签到脚本
pubDate: 12 01 2024
image: https://img.trtyr.top/images/blog/Python%E5%AE%9E%E7%8E%B0Telegram%E8%87%AA%E5%8A%A8%E7%AD%BE%E5%88%B0%E8%84%9A%E6%9C%AC/Python%E5%AE%9E%E7%8E%B0Telegram%E8%87%AA%E5%8A%A8%E7%AD%BE%E5%88%B0%E8%84%9A%E6%9C%AC-4.webp
categories:
  - 其他
tags:
  - Telegram
---

下午突然想起来 Telegram 好几天没签到了，每次手动签到我也厌倦了，于是研究了一下写了个简易的Python 脚本

## 申请 API

来到 https://my.telegram.org/auth 中，申请 API 接口

![](https://img.trtyr.top/images/blog/Python%E5%AE%9E%E7%8E%B0Telegram%E8%87%AA%E5%8A%A8%E7%AD%BE%E5%88%B0%E8%84%9A%E6%9C%AC/Python%E5%AE%9E%E7%8E%B0Telegram%E8%87%AA%E5%8A%A8%E7%AD%BE%E5%88%B0%E8%84%9A%E6%9C%AC-1.webp)

根据英文提示，信息会通过 Telegram 进行发送，而不是 SMS

![](https://img.trtyr.top/images/blog/Python%E5%AE%9E%E7%8E%B0Telegram%E8%87%AA%E5%8A%A8%E7%AD%BE%E5%88%B0%E8%84%9A%E6%9C%AC/Python%E5%AE%9E%E7%8E%B0Telegram%E8%87%AA%E5%8A%A8%E7%AD%BE%E5%88%B0%E8%84%9A%E6%9C%AC-2.webp)

输出信息后来到如下界面

![](https://img.trtyr.top/images/blog/Python%E5%AE%9E%E7%8E%B0Telegram%E8%87%AA%E5%8A%A8%E7%AD%BE%E5%88%B0%E8%84%9A%E6%9C%AC/Python%E5%AE%9E%E7%8E%B0Telegram%E8%87%AA%E5%8A%A8%E7%AD%BE%E5%88%B0%E8%84%9A%E6%9C%AC-3.webp)

选择 `API development tools` 并填写必要信息

![](https://img.trtyr.top/images/blog/Python%E5%AE%9E%E7%8E%B0Telegram%E8%87%AA%E5%8A%A8%E7%AD%BE%E5%88%B0%E8%84%9A%E6%9C%AC/Python%E5%AE%9E%E7%8E%B0Telegram%E8%87%AA%E5%8A%A8%E7%AD%BE%E5%88%B0%E8%84%9A%E6%9C%AC-4.webp)

这里注意，似乎需要和手机号相同的地区 IP 才可以，`+86` 的话需要使用香港地区。如果出现了 `error` 弹窗，那就是你梯子的问题。

创建 APP 后，来到如下界面。

![](https://img.trtyr.top/images/blog/Python%E5%AE%9E%E7%8E%B0Telegram%E8%87%AA%E5%8A%A8%E7%AD%BE%E5%88%B0%E8%84%9A%E6%9C%AC/Python%E5%AE%9E%E7%8E%B0Telegram%E8%87%AA%E5%8A%A8%E7%AD%BE%E5%88%B0%E8%84%9A%E6%9C%AC-5.webp)

在这里我们可以得到 `api_id` 和 `api_hash`，这两个是我们需要的。

## 代码部分

由于是下午顺手赶出来的，对我来说刚好够用，代码可能比较粗糙，如果想要更多细节请自行对其修改。

代码使用的是 `telethon` 库，这是一个基于 Mtproto 协议实现的库，提供异步 API。该库需要我们申请 Telegram API 得到必要参数才可正常运行。

由于本人不是经常看 Telegram，但是我喜欢闲的没事儿看看邮箱，所以程序会将代码的结果通过 QQ 邮箱转发给一个常用邮箱。

首先安装 `telethon` 库，如果还缺啥库，请自行根据报错提示进行操作。

```python
pip install telethon
```

然后请在当前文件夹下创建一个 `config.ini` 用来存放你的配置信息

```ini
[telegram]
API_ID =
API_HASH =

[email]
SENDER =
PASSWORD =

[bot_1]
USERNAME =
CHECKIN_COMMAND =

[bot_2]
USERNAME =
CHECKIN_COMMAND =
```

其中 `API_ID` 和 `API_HASH` 就是我们注册 API 得到的信息；为了应付以后可能会增加的 bot 数量，可以在配置文件这里按照格式添加对应的数据。其中 `USERNAME` 是 bot 的 Username。`CHECKIN_COMMAND` 是要执行的签到命令。`SENDER` 是发件人的邮箱，这里选择的是 QQ 邮箱；`PASSWORD` 是 QQ 邮箱的授权码，自行申请。当然，你也可以改成别的邮箱，简单改改代码就行。

实际代码如下。

```python
from telethon import TelegramClient, events
import configparser
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

config = configparser.ConfigParser()
config.read('config.ini')
API_ID = int(config['telegram']['API_ID'])
API_HASH = config['telegram']['API_HASH']

client = TelegramClient('auto_sign_in_client', API_ID, API_HASH)

completed_bots = set()


def send_email(subject, body, to_email):
    sender_email = config['email']['SENDER']
    sender_password = config['email']['PASSWORD']

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP_SSL('smtp.qq.com', 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, to_email, msg.as_string())
            print(f"邮件已发送到 {to_email}")
            server.quit()
    except Exception as e:
        print(f"发送邮件失败: {e}")


async def handle_checkin_message(event, section):
    if event.message:
        sender = await event.get_sender()
        sender_name = sender.username if sender.username else "未知用户名"
        sender_id = sender.id

        print(f"[*] 收到机器人{sender_name} (ID: {sender_id})返回的消息:")
        print(event.message.text)

        if event.message.text != '':
            print(f"@{sender_name} 签到完成！\n{'-' * 50}")
            completed_bots.add(sender_name)

            if len(completed_bots) == len([
                    section for section in config.sections()
                    if section.startswith('bot_')
            ]):
                print("所有机器人的签到完成，程序结束。")

                subject = "签到结果"
                body = "Telegram 签到完成。程序已结束。\n\n" + "\n".join(
                    [f"{sender_name} 签到成功"
                     for sender_name in completed_bots])  # 使用 sender_name
                send_email(subject, body, "z1693309049@outlook.com")
                await client.disconnect()
    else:
        print("结束")
        await client.disconnect()


async def send_checkin_command(channel_id, checkin_command):
    await client.send_message(channel_id, checkin_command)


async def setup_bot(section):
    channel_id = config[section]['USERNAME']
    checkin_command = config[section]['CHECKIN_COMMAND']

    await send_checkin_command(channel_id, checkin_command)

    @client.on(events.NewMessage(chats=channel_id))
    async def handler(event):
        await handle_checkin_message(event, section)


async def main():
    for section in config.sections():
        if section.startswith('bot_'):
            await setup_bot(section)

    await client.run_until_disconnected()


client.start()
client.loop.run_until_complete(main())

```

测试的时候没发现什么 BUG，代码可用。这里注意脚本需要在对应的代理下使用。

初次运行成功会让你进行认证，也就是输入手机号（中国大陆别忘了加 `+86`），然后会在当前文件夹下生成 `session` 文件，以后运行就不用再次认证了。

![](https://img.trtyr.top/images/blog/Python%E5%AE%9E%E7%8E%B0Telegram%E8%87%AA%E5%8A%A8%E7%AD%BE%E5%88%B0%E8%84%9A%E6%9C%AC/Python%E5%AE%9E%E7%8E%B0Telegram%E8%87%AA%E5%8A%A8%E7%AD%BE%E5%88%B0%E8%84%9A%E6%9C%AC-6.webp)

实际效果如下

![](https://img.trtyr.top/images/blog/Python%E5%AE%9E%E7%8E%B0Telegram%E8%87%AA%E5%8A%A8%E7%AD%BE%E5%88%B0%E8%84%9A%E6%9C%AC/Python%E5%AE%9E%E7%8E%B0Telegram%E8%87%AA%E5%8A%A8%E7%AD%BE%E5%88%B0%E8%84%9A%E6%9C%AC-1.webp)

邮箱收到的结果如下

![](https://img.trtyr.top/images/blog/Python%E5%AE%9E%E7%8E%B0Telegram%E8%87%AA%E5%8A%A8%E7%AD%BE%E5%88%B0%E8%84%9A%E6%9C%AC/Python%E5%AE%9E%E7%8E%B0Telegram%E8%87%AA%E5%8A%A8%E7%AD%BE%E5%88%B0%E8%84%9A%E6%9C%AC-2.webp)

## 定时运行

这里就没啥好说的的，我是直接放 Linux 服务器上了，利用 `crontab` 定时任务就行

```
0 7 * * * /usr/bin/python3 /root/Telegram自动签到/main.py
```

![](https://img.trtyr.top/images/blog/Python%E5%AE%9E%E7%8E%B0Telegram%E8%87%AA%E5%8A%A8%E7%AD%BE%E5%88%B0%E8%84%9A%E6%9C%AC/Python%E5%AE%9E%E7%8E%B0Telegram%E8%87%AA%E5%8A%A8%E7%AD%BE%E5%88%B0%E8%84%9A%E6%9C%AC-3.webp)

如果你没有服务器，可以放到 Github 上，创建私有仓库然后创建一个 Action。
