---
title: Kerberos流量解密
description: Kerberos流量解密
pubDate: 01 10 2025
image: https://img.trtyr.top/images/blog/Kerberos%E6%B5%81%E9%87%8F%E8%A7%A3%E5%AF%86/004%20Kerberos%E6%B5%81%E9%87%8F%E8%A7%A3%E5%AF%86-9.webp
categories:
  - 网络安全
tags:
  - 网络协议
  - 其他
---

在学习 Kerberos 协议的时候，需要对 Kerberos 协议流量进行解密，以更好的了解 Kerberos 协议的传输过程。本篇文章是通过生成 `keytab` 文件，在 Wireshark 里加载实现对流量的解密。

`keytab`（简称“密钥表”）存储一个或多个主体的长期密钥。通常 `keytab` 以标准格式的文件表示，在极少数情况下，它们可以以其他方式表示。`keytab` 最常用于允许服务器应用程序接受客户端的身份验证，但也可以用于为客户端应用程序获取初始凭据。

这里使用了两个工具

- `esedbexport`
- `NTDSXtract`

## 准备

### 域控导出 Ntds.dit

我们需要在域控里导出 `Ntds.dit`

域控环境为 `Windows Server 2016`

```shell
vssadmin create shadow /for=C:
```

执行该命令后，会给出副本卷名

![](https://img.trtyr.top/images/blog/Kerberos%E6%B5%81%E9%87%8F%E8%A7%A3%E5%AF%86/004%20Kerberos%E6%B5%81%E9%87%8F%E8%A7%A3%E5%AF%86-2.webp)

接着将 `ntds.dit` 和 `system.hive` 拷贝出来，这里拷贝到 `C盘` 下。注意命令里的卷名，如果得到结果和图片不用，请自行修改命令。

```shell
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy4\Windows\NTDS\NTDS.dit C:\ntds.dit
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy4\Windows\System32\config\SYSTEM C:\system.hive
```

![](https://img.trtyr.top/images/blog/Kerberos%E6%B5%81%E9%87%8F%E8%A7%A3%E5%AF%86/004%20Kerberos%E6%B5%81%E9%87%8F%E8%A7%A3%E5%AF%86-3.webp)

这样就得到了 `ntds.dit` 和 `system.hive`

![](https://img.trtyr.top/images/blog/Kerberos%E6%B5%81%E9%87%8F%E8%A7%A3%E5%AF%86/004%20Kerberos%E6%B5%81%E9%87%8F%E8%A7%A3%E5%AF%86-4.webp)

### esedbexport 安装

实验环境为 `Kali Linux`

```shell
apt-get install autoconf automake autopoint libtool pkg-config
# 下载esedbexport，这里是当前最新版，请根据实际情况自行修改下载链接
wget https://github.com/libyal/libesedb/releases/tag/20240420
tar zxvf libesedb-experimental-20240420.tar.gz
cd libesedb-20240420
./configure
make
make install
ldconfig
```

至此，安装成功。

![](https://img.trtyr.top/images/blog/Kerberos%E6%B5%81%E9%87%8F%E8%A7%A3%E5%AF%86/004%20Kerberos%E6%B5%81%E9%87%8F%E8%A7%A3%E5%AF%86-1.webp)

### NTDSXtract 安装

执行如下命令，注意命令使用的是 `python2`

```shell
git clone https://github.com/csababarta/ntdsxtract.git
cd ntdsxtract
python2 setup.py build
python2 setup.py install
```

## Keytab 生成

将 `ntds.dit` 存在在 `Kali` 里，执行命令

```shell
esedbexport -m tables ntds.dit
```

这样，我们就得到了一个 `ntds.dit.export` 文件夹

![](https://img.trtyr.top/images/blog/Kerberos%E6%B5%81%E9%87%8F%E8%A7%A3%E5%AF%86/004%20Kerberos%E6%B5%81%E9%87%8F%E8%A7%A3%E5%AF%86-5.webp)

我们主要用的是

- `datatable.4`
- `link_table.7`

接着将 `ntds.dit.export` 和 SYSTEM 文件放入到 `ntdsxtract` 工具文件夹中，执行命令

```
python2 dskeytab.py ntds.dit.export/datatable.4 ntds.dit.export/link_table.7 system.hive ./ kerberos.keytab
```

可能会出现报错 `ImportError: No module named Crypto.Hash`，请自行安装 `python2` 的 `pycryptodome` 库

至此，得到一个 `kerberos.keytab`

## WireShark 解密

打开 wireshark，右击 `kerberos` 流量，按照下方图片进行操作

![](https://img.trtyr.top/images/blog/Kerberos%E6%B5%81%E9%87%8F%E8%A7%A3%E5%AF%86/004%20Kerberos%E6%B5%81%E9%87%8F%E8%A7%A3%E5%AF%86-6.webp)

打开 `Kerberos` 首选项

![](https://img.trtyr.top/images/blog/Kerberos%E6%B5%81%E9%87%8F%E8%A7%A3%E5%AF%86/004%20Kerberos%E6%B5%81%E9%87%8F%E8%A7%A3%E5%AF%86-7.webp)

选择你刚才生成的 `keytab`。然后就能看到解密后的流量了。

![](https://img.trtyr.top/images/blog/Kerberos%E6%B5%81%E9%87%8F%E8%A7%A3%E5%AF%86/004%20Kerberos%E6%B5%81%E9%87%8F%E8%A7%A3%E5%AF%86-8.webp)

蓝色代表解密成功。后面可以看到使用的密钥。
