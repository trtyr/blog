---
title: Linux渗透 Capabilities提权
description: Linux渗透 Capabilities提权
pubDate: 11 13 2024
image: https://img.trtyr.top/images/blog/Linux%20Capabilities%E6%8F%90%E6%9D%83/002%20Linux%20Capabilities%E6%8F%90%E6%9D%83-2.webp
categories:
  - 网络安全
tags:
  - Linux提权
---

## Capabilities

在Linux中，Capabilities（能力）是一种权限管理机制，提供了更细粒度的控制方式，使得进程可以拥有特定的权限，而不需要具备完整的超级用户（root）权限。这种机制帮助减少进程获得不必要的权限，从而提升系统的安全性。

传统上，Linux使用用户ID（UID）和组ID（GID）来控制进程权限。root 用户（UID为0）被赋予系统中的所有权限。对于某些需要部分特权的程序，例如绑定到特定端口的网络应用，必须通过 root 权限运行，这带来了不必要的安全风险。

Capabilities 允许将超级用户的权限分解成更小的权限单位，并根据需要赋予进程。这意味着一个进程可以拥有有限的特权，例如只允许绑定低编号端口或管理网络配置，而不授予其他危险的权限。

通过 Capabilities，可以将某些系统程序配置为在非 root 权限下运行。例如，Nginx可以绑定到80端口（默认root权限才能操作），但借助 CAP_NET_BIND_SERVICE，只需赋予 Nginx 该 Capability，而无需授予完整的 root 权限。

## Capabiliies 权限介绍

这里涉及两个值，能力和能力值

| Capability 名称     | 描述                                                         |
| ------------------- | ------------------------------------------------------------ |
| CAPAUDITCONTROL     | 启用和禁用内核审计；改变审计过滤规则；检索审计状态和过滤规则 |
| CAPAUDITREAD        | 允许通过 multicast netlink 套接字读取审计日志                |
| CAPAUDITWRITE       | 将记录写入内核审计日志                                       |
| CAPBLOCKSUSPEND     | 使用可以阻止系统挂起的特性                                   |
| **CAP_CHOWN**       | 修改文件所有者的权限                                         |
| CAPDACOVERRIDE      | 忽略文件的 DAC 访问限制                                      |
| CAP_DAC_READ_SEARCH | 忽略文件读及目录搜索的 DAC 访问限制                          |
| CAP_FOWNER          | 忽略文件属主 ID 必须和进程用户 ID 相匹配的限制               |
| CAP_FSETID          | 允许设置文件的 setuid 位                                     |
| CAPIPCLOCK          | 允许锁定共享内存片段                                         |
| CAPIPCOWNER         | 忽略 IPC 所有权检查                                          |
| CAP_KILL            | 允许对不属于自己的进程发送信号                               |
| CAP_LEASE           | 允许修改文件锁的 FL_LEASE 标志                               |
| CAPLINUXIMMUTABLE   | 允许修改文件的 IMMUTABLE 和 APPEND 属性标志                  |
| CAPMACADMIN         | 允许 MAC 配置或状态更改                                      |
| CAPMACOVERRIDE      | 忽略文件的 DAC 访问限制                                      |
| CAP_MKNOD           | 允许使用 mknod() 系统调用                                    |
| CAPNETADMIN         | 允许执行网络管理任务                                         |
| CAPNETBIND_SERVICE  | 允许绑定到小于 1024 的端口                                   |
| CAPNETBROADCAST     | 允许网络广播和多播访问                                       |
| CAPNETRAW           | 允许使用原始套接字                                           |
| CAP_SETGID          | 允许改变进程的 GID                                           |
| CAP_SETFCAP         | 允许为文件设置任意的 capabilities                            |
| CAP_SETPCAP         | 参考 capabilities man page                                   |
| CAP_SETUID          | 允许改变进程的 UID                                           |
| CAPSYSADMIN         | 允许执行系统管理任务，如加载或卸载文件系统、设置磁盘配额等   |
| CAPSYSBOOT          | 允许重新启动系统                                             |
| CAPSYSCHROOT        | 允许使用 chroot() 系统调用                                   |
| CAPSYSMODULE        | 允许插入和删除内核模块                                       |
| CAPSYSNICE          | 允许提升优先级及设置其他进程的优先级                         |
| CAPSYSPACCT         | 允许执行进程的 BSD 式审计                                    |
| CAPSYSPTRACE        | 允许跟踪任何进程                                             |
| CAPSYSRAWIO         | 允许直接访问 /devport、/dev/mem、/dev/kmem 及原始块设备      |
| CAPSYSRESOURCE      | 忽略资源限制                                                 |
| CAPSYSTIME          | 允许改变系统时钟                                             |
| CAPSYSTTY_CONFIG    | 允许配置 TTY 设备                                            |
| CAP_SYSLOG          | 允许使用 syslog() 系统调用                                   |
| CAPWAKEALARM        | 允许触发一些能唤醒系统的东西(比如 CLOCKBOOTTIMEALARM 计时器) |

以下功能特别危险，如果发现系统上启用了这些功能，则应进一步进行检查：

| Capability 名称         | 描述                                                                          |
| ----------------------- | ----------------------------------------------------------------------------- |
| **CAP_CHOWN**           | 允许更改文件所有者和组。                                                      |
| **CAP_DAC_OVERRIDE**    | 绕过文件的访问控制列表（ACL），允许忽略文件的读、写和执行权限。               |
| **CAP_DAC_READ_SEARCH** | 允许在文件和目录上执行读取和搜索操作，忽略所有权和权限限制。                  |
| **CAP_SETUID**          | 允许设置用户 ID (UID)，包括执行 `setuid` 系统调用以更改进程的实际和有效 UID。 |
| **CAP_SETGID**          | 允许设置组 ID (GID)，包括执行 `setgid` 系统调用以更改进程的实际和有效 GID。   |
| **CAP_NET_RAW**         | 允许使用原始套接字和执行网络广播接收等操作。                                  |
| **CAP_SYS_ADMIN**       | 提供多种系统管理功能，包括挂载文件系统、执行系统重启、管理 Swap 等。          |
| **CAP_SYS_PTRACE**      | 允许使用 `ptrace` 调试进程，跟踪其他进程的系统调用。                          |
| **CAP_SYS_MODULE**      | 允许加载和卸载内核模块。                                                      |
| **CAP_FORMER**          | 未知或不属于标准 Linux 能力。                                                 |
| **CAP_SETFCAP**         | 允许设置文件系统的权限标记（File Capabilities）。                             |

能力值：

| **能力值** | **描述**                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `=`        | 该值设置可执行文件的指定功能，但不授予任何权限。如果我们想清除可执行文件之前设置的功能，这会很有用。                                                                                                       |
| `+ep`      | 该值向可执行文件授予指定功能的有效和允许的权限。这允许可执行文件执行该功能允许的操作，但不允许它执行该功能不允许的任何操作。                                                                               |
| `+ei`      | 该值向可执行文件授予指定功能的足够且可继承的权限。这允许可执行文件执行该功能允许的操作，并且允许可执行文件生成的子进程继承该功能并执行相同的操作。                                                         |
| `+p`       | 该值向可执行文件授予指定功能的允许权限。这允许可执行文件执行该功能允许的操作，但不允许它执行该功能不允许的任何操作。如果我们想要向可执行文件授予该功能但阻止它继承该功能或允许子进程继承它，这可能很有用。 |

## 如何设置与移除 Capabilities

可以使用 `setcap` 命令进行设置。例如，给 Nginx 进程二进制文件赋予 `CAP_NET_BIND_SERVICE` 权限：

```shell
#设置capabilities权限
setcap CAP_SETUID=+ep /usr/bin/python

#移除capabilities权限
setcap -r /usr/sbin/python
```

## Capabilities 利用

现在假设管理员对一些可执行文件设置了 Capabilities。测试人员通过下面的命令查找这些文件：

```shell
getcap -r / 2>/dev/null
```

![](https://img.trtyr.top/images/blog/Linux%20Capabilities%E6%8F%90%E6%9D%83/002%20Linux%20Capabilities%E6%8F%90%E6%9D%83-1.webp)

当我们发现有些应用存在某些权限的时候，可以利用这些权限去进行利用。

利用例子：[VulnHub靶场 Hacker_Kid - 啦啦啦](https://www.trtyr.top/blog/vulnhub%E9%9D%B6%E5%9C%BA-hacker_kid/#heading-5)
