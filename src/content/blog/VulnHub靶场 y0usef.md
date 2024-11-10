---
title: VulnHub靶场 y0usef
description: VulnHub靶场 y0usef WP
pubDate: 10 18 2024
image: https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20y0usef/008%20y0usef-17.webp
categories:
  - 网络安全
tags:
  - 靶场
  - VulnHub靶场
  - 渗透测试
---

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20y0usef/008%20y0usef-17.webp)

## 主机发现

进行主机发现

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20y0usef/008%20y0usef-1.webp)

得到目标 IP 为 `192.168.10.4`，对其进行端口扫描

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20y0usef/008%20y0usef-2.webp)

发现目标 22 端口和 80 端口开放。访问目标 80 端口

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20y0usef/008%20y0usef-3.webp)

发现目标网站还在建设中。查看源码，里面啥也没有。对其进行目录爆破

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20y0usef/008%20y0usef-4.webp)

发现 `adminstration` 目录，进行访问，得到如下界面

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20y0usef/008%20y0usef-5.webp)

显示无权限。

## 403 绕过

页面返回 403 响应，我们尝试绕过

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20y0usef/008%20y0usef-6.webp)

绕过成功，设置一下 `XFF` 就行了

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20y0usef/008%20y0usef-7.webp)

我们直接拦截将 XFF 注入进去，成功返回页面

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20y0usef/008%20y0usef-8.webp)

我们尝试登录，弱口令 `admin:admin` 成功登录。记得这一步也需要拦截加 XFF。来到如下界面

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20y0usef/008%20y0usef-9.webp)

发现存在文件上传入口，直接上传木马。不过这里注意，MIME 类型 jpeg 上传不了，修改为 png

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20y0usef/008%20y0usef-10.webp)

使用蚁剑连接

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20y0usef/008%20y0usef-11.webp)

成功拿到 shell

## 直接提权

在 home 下发现一个 `user.txt`

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20y0usef/008%20y0usef-12.webp)

一眼 base64 编码，解码，得到如下结果

```
ssh :
user : yousef
pass : yousef123
```

似乎是 ssh 账户密码，尝试连接。

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20y0usef/008%20y0usef-13.webp)

连接成功，然后就有点见鬼了，`sudo -l` 发现是 ALL

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20y0usef/008%20y0usef-14.webp)

然后直接 `sudo passwd root` 改了 root 用户密码，然后就登录进去了

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20y0usef/008%20y0usef-15.webp)

其实 `sudo -s` 也能直接提权

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20y0usef/008%20y0usef-16.webp)
