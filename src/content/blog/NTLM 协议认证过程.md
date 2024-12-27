---
title: NTLM 协议认证过程
description: NTLM 协议认证过程
pubDate: 12 27 2024
image: https://img.trtyr.top/images/blog/NTLM%20%E5%8D%8F%E8%AE%AE%E8%AE%A4%E8%AF%81%E8%BF%87%E7%A8%8B/004%20NTLM%20%E5%8D%8F%E8%AE%AE%E8%AE%A4%E8%AF%81-10.webp
categories:
  - 网络安全
tags:
  - 网络协议
---

## SSPI

SSPI（Security Support Provider Interface） 是一个 API，它为 Windows 应用程序提供了身份验证服务和其他安全功能的标准接口。它是 Windows 操作系统的安全性子系统的一部分。

主要功能

- 身份验证：支持用户的身份验证（例如 Kerberos、NTLM）。
- 加密与解密：在通信中提供消息的加密和解密服务，确保数据的机密性。
- 数据完整性：提供消息完整性检查，防止数据在传输中被篡改。
- 安全上下文管理：支持安全上下文的初始化、维护和销毁。
- 协议无关：SSPI 并不绑定具体的协议，它可以支持多种 SSP。

SSPI 的核心是通过提供一组标准化的接口（函数），允许应用程序在无需了解底层协议的情况下实现安全通信。这些接口包括：

- **`InitializeSecurityContext`**：初始化安全上下文。
- **`AcceptSecurityContext`**：接受或验证来自客户端的安全上下文。
- **`EncryptMessage`** 和 **`DecryptMessage`**：加密和解密消息。
- **`QueryContextAttributes`**：查询安全上下文的属性。

SSPI 支持多种安全协议的实现，包括但不限于：

- Kerberos
- NTLM
- Digest
- SSL/TLS

## SSP

SSP 是具体实现安全协议的DLL，它作为 SSPI 的实现者，提供了实际的安全功能。换句话说，SSP 是实现安全服务的插件。

SSP 本身就是一堆 DLL

NTLM（msv1_0.dll）

- 引入版本：Windows NT 3.51
- 功能：
  - 提供 NTLM 质询/响应机制，用于身份验证。
  - 适用于非域环境或较早期的域环境。
  - 支持 SMB/CIFS 协议的身份验证。
- 特点：
  - 兼容性高：可以在没有 Active Directory 支持的环境中使用。
  - 安全性较弱：由于使用弱加密和哈希算法（如 MD4 和 DES），容易受到中间人攻击和离线破解攻击。

Kerberos（kerberos.dll）

- 引入版本：Windows 2000
- 更新：Windows Vista 增加对 AES 的支持。
- 功能：
  - 提供基于票据的强身份验证协议。
  - 支持域环境下的客户端-服务器双向身份验证。
- 特点：
  - 安全性强：基于共享密钥和对称加密。
  - 支持单点登录（SSO）：用户只需一次身份验证即可访问多种资源。
  - 域依赖：需要 Active Directory 支持。

Negotiate（secur32.dll）

- 引入版本：Windows 2000
- 功能：
  - 自动选择最佳协议：首选 Kerberos，如果 Kerberos 不可用则回退到 NTLM。
  - 支持集成 Windows 身份验证（Integrated Windows Authentication）。
- 特点：
  - 灵活性高：在多种环境下工作（域环境优先 Kerberos，非域环境使用 NTLM）。
  - 单点登录支持：在域环境下，能无缝集成 SSO。

安全通道（SChannel，Schannel.dll）

- 引入版本：Windows 2000
- 更新：Windows Vista 添加对 AES 和 ECC 的支持。
- 功能：
  - 提供 SSL/TLS 支持，确保客户端和服务器之间的安全通信。
  - 加密数据传输，保护通信的机密性和完整性。
- 特点：
  - 支持现代加密算法：如 AES 和 ECC。
  - 安全性强：是 HTTPS 的核心技术之一。
  - 用途广泛：用于浏览器和服务器间的安全连接。

PCT（过时）和 TLS/SSL

- 功能：
  - 提供基于公开密钥加密的客户端和服务器身份验证。
  - 使用 TLS/SSL 协议为互联网通信提供加密。
- 特点：
  - PCT 已过时：被 TLS 完全取代。
  - TLS 更新支持：Windows 7 支持 TLS 1.2，提高了安全性。

摘要 SSP（wdigest.dll）

- 引入版本：Windows XP
- 功能：
  - 基于 HTTP 和 SASL 的质询/响应身份验证。
  - 用于与非 Windows 系统的通信（如 Web 应用中的 HTTP Digest 身份验证）。
- 特点：
  - 跨平台性：在无法使用 Kerberos 的情况下提供替代身份验证机制。
  - 安全性中等：比 NTLM 安全，但弱于 Kerberos 和 TLS。

凭据 SSP（CredSSP，credssp.dll）

- 引入版本：Windows Vista（也支持 Windows XP SP3）
- 功能：
  - 提供远程桌面协议（RDP）的身份验证。
  - 支持单点登录（SSO）和网络级身份验证。
- 特点：
  - 专用性：主要用于 RDP 场景。
  - 增强用户体验：通过 SSO 减少用户登录的频率。

分布式密码验证（DPA，msapsspc.dll）

- 引入版本：Windows 2000
- 功能：
  - 使用数字证书完成互联网身份验证。
- 特点：
  - 数字证书支持：通过公钥基础设施（PKI）实现安全验证。
  - 适用范围较窄：主要用于特定场景。

用户对用户的公开密钥加密技术（PKU2U，pku2u.dll）

- 引入版本：Windows 7
- 功能：
  - 为不在域中的系统提供对等身份验证。
  - 使用数字证书实现安全通信。
- 特点：
  - 对等性：无需域环境即可实现安全验证。
  - 适用场景：如家庭网络或临时对等网络。

因为 SSPI 中定义了和 Session Security 有关的 API，所以上层协议利用任意 SSP 与远端的服务进行身份认证后，SSP 会为本地连接生成一个随机的 Key。这个随机的 Key 被称为 Session Key。上层应用经过身份认证后，可以选择的使用这个 key 对之后的通信进行签名或者加密

## LM Hash 加密算法

LM 是微软推出的一个身份认证协议，使用的加密算法是 `LM Hash`。

`LM Hash` 本质是 DES 加密，尽管 `LM Hash` 较容易被破解，但为了保证系统的兼容性，Windows 只是将 `LM Hash` 禁用，从 Windows Vista 和 Windows Server 2008 开始，Windows 默认禁用 `LM Hash`。

`LM Hash` 明文密码被限定在14位以内，也就是说，若要停止使用`LM Hash`，将用户的密码设置为14位以上即可。如果 `LM Hash` 的值为 `aad3b435b51404eeaad3b435b51404ee`，说明 `LM Hash` 为空值或者被禁用了。

`LM Hash` 的加密流程如下，我们以明文口令 `P@ss1234` 为例演示。

- 将用户的明文口令转换为大写，并转换为十六进制字符串
  - `P@ss12345` -> `P@SS1234` -> `5040535331323334`
- 如果转换后的十六进制字符串的长度不足 14 B (长度 28)，用 0 来补全。
  - `5040535331323334` -> `5040535331323334000000000000`
- 将 14 B 分为两组，每组 7 B，然后转换为二进制数据，每组二进制数据长度为 56 bit

| 50       | 40       | 53       | 53       | 31       | 32       | 33       |
| -------- | -------- | -------- | -------- | -------- | -------- | -------- |
| 01010000 | 01000000 | 01010011 | 01010011 | 00110001 | 00110010 | 00110011 |

拼接后数据：`01010000010000000101001101010011001100010011001000110011`

| 34       | 00       | 00       | 00       | 00       | 00       | 00       |
| -------- | -------- | -------- | -------- | -------- | -------- | -------- |
| 00110100 | 00000000 | 00000000 | 00000000 | 00000000 | 00000000 | 00000000 |

拼接后数据：`00110100000000000000000000000000000000000000000000000000`

- 将每组二进制数据按 7 bit 为一组，分为 8 组，每组末尾加 0，再转换成十六进制，这样每组也就成了 8 B 长度的十六进制数据了

| 0101000  | 0010000  | 0001010  | 0110101  | 0011001  | 1000100  | 1100100  | 0110011  |
| -------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- |
| 01010000 | 00100000 | 00010100 | 01101010 | 00110010 | 10001000 | 11001000 | 01100110 |

转化成十六进制：`5020146a3288c866`

| 0011010  | 0000000  | 0000000  | 0000000  | 0000000  | 0000000  | 0000000  | 0000000  |
| -------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- |
| 00110100 | 00000000 | 00000000 | 00000000 | 00000000 | 00000000 | 00000000 | 00000000 |

转化成十六进制：`3400000000000000`

- 将上面生成的两组 8 B 的十六进制数据，分别作为 DES 加密密钥对字符串 "KGS!@#$%” 进行加密。然后将 DES 加密后的两组密文进行拼接，得到最终的 `LM Hash`

| 明文     | 秘钥             | DES 加密         |
| -------- | ---------------- | ---------------- |
| KGS!@#$% | 5020146a3288c866 | 896108C0BBF35B5C |
| KGS!@#$% | 3400000000000000 | FF17365FAF1FFE89 |

拼接后得到最终的 `LM Hash`：`896108C0BBF35B5CFF17365FAF1FFE89`

## NTLM Hash 加密算法

因为是固定明文进行加密，而且这玩意还是写死的，所以有着极大的安全隐患。

为了解决 LM Hash 加密和身份验证方案中固有的安全弱点，微软于 1993 年在 Windows NT 3.1 中首次引人了 NTLM Hash。微软从 Windows Vista 和 Windows Server 2008 开始，默认禁用了 LM Hash，只存储 NTLM Hash，而 LM Hash 的位置则为空: `aad3b435b51404eeaad3b435b51404ee`。

- 将密码转化成 ASCII 编码，然后逐个编码转成 16 进制。

| 字符    | P   | @   | s   | s   | 1   | 2   | 3   | 4   |
| ------- | --- | --- | --- | --- | --- | --- | --- | --- |
| ASCII   | 80  | 64  | 115 | 115 | 49  | 50  | 51  | 52  |
| 16 进制 | 50  | 40  | 73  | 73  | 31  | 32  | 33  | 34  |

拼接后字符：`5040737331323334`

- 将 ASCII 编码的十六进制字逐个转化成 Unicode 编码 (Unicode 编码是在每个 16 进制字节后面加 00)。

  - `5040737331323334` -> `50004000730073003100320033003400`

- 对 Unicode 编码进行 MD 4 加密
  - `50004000730073003100320033003400` -> `74520a4ec2626e3638066146a0d5ceae`

## 系统存储的 NTLM Hash

用户的密码经过 NTLM Hash 加密后，存储在 SAM 文件中

```
C:\Windows\System32\config\SAM
```

用户输入密码进行本地认证的过程都是在本地进行的。

用户进行登录认证，主要涉及了这几个进程

- `winlogon.exe`
- `logonUI.exe`
- `Credential Provider`
- `lsass.exe`
- `netlogon.dll`

1. 首先 `winlogon` 会调用 `logonUI` 显示一个登录窗口让用户输入。
2. 用户输入后 `winlogon` 调用 `Credential Provider`，把输入的信息交给 `lsass`
3. `lsass` 进程中会存有明文密码，他会将密码加密成 NTLM Hash，和 SAM 数据库里的信息进行比较。
4. `lsass.exe` 将认证结果传回 `winlogon.exe`
   1. 如果认证成功：启动用户的初始化过程（加载用户配置文件）。
   2. 如果认证失败：显示错误消息并允许用户重试。

上述的是本地操作，如果是域用户的话

1. 首先 `winlogon` 会调用 `logonUI` 显示一个登录窗口让用户输入域用户名和密码。
2. 用户输入后，`winlogon` 调用 `Credential Provider`，将用户输入的凭据交给 `lsass`。
3. `lsass` 进程处理凭据验证：
   1. `lsass` 会通过 `Kerberos`（默认）或 `NTLM` 协议，与域控制器通信进行身份认证。
      1. **Kerberos：**
         - `lsass` 生成一个认证请求，将用户名和密码加密为 Kerberos 票据。
         - 将票据发送给域控制器的 KDC（密钥分发中心）验证。
         - 域控制器验证票据后，返回 TGT（票据授予票据），授权用户访问域资源。
      2. **NTLM：**（如果 Kerberos 不可用）
         - `lsass` 将密码加密为 NTLM Hash，并向域控制器发送身份认证请求。
         - 域控制器根据其安全账户管理数据库（SAM 或 Active Directory）验证 NTLM Hash 是否匹配。
   2. 如果域控制器验证成功，会返回认证成功的消息。
4. `lsass.exe` 将认证结果传回 `winlogon.exe`：
   1. 如果认证成功：
      - 启动用户的初始化过程（如加载用户配置文件，组策略等）。
      - 调用 `userinit` 和 `explorer`，显示用户桌面。
   2. 如果认证失败：
      - 显示错误消息，并允许用户重新输入。

## 工作组下的 NTLM 认证

NTLM 协议是一种基于 `Challenge/Response` 的验证机制，由三种类型的消息构成

- Type 1：Negotiate
- Type 2：Challenge
- Type 3：Authentication

NTLM 协议有两个版本，`v1` 和 `v2`，不过 `v2` 用的多。两者区别在于 `Challenge` 值与加密算法的不同。这里用的是 `NTLM v2`

### 认证流程

流程图

![](https://img.trtyr.top/images/blog/NTLM%20%E5%8D%8F%E8%AE%AE%E8%AE%A4%E8%AF%81%E8%BF%87%E7%A8%8B/004%20NTLM%20%E5%8D%8F%E8%AE%AE%E8%AE%A4%E8%AF%81-11.webp)

1. 当客户端想要访问服务器的某个服务时，进行身份认证。在客户端输入完账户密码 `A:a` 后会在本地缓存一份 NTLM Hash 值 `NTLM(A:a)`。然后 C 向 S 发送 `NTLMSSP_Negotiate` 消息
2. S 收到 C 的 `NTLMSSP_Negotiate` 消息后，读取其中的内容，从中选择自己能接收的信息，传入 `NTLM SSP`，得到一个 `NTLMSSP_Chanllenge` 消息，这个消息里有个 16 位的随机 `Challenge` 值，S 本地缓存这个值。S 向 C 发送 `NTLMSSP_Challenge` 消息
3. C 收到 `NTLMSSP_Challenge` 消息后，读取支持的内容，从中获取 `Challenge` 值，用 `NTLM(A:a)` 对 `Chanllenge` 值进行一系列的加密得到 `Response` 消息，这里存在一个 `Net-NTLM Hash(Client)`。最后将 `Response` 消息和其他的信息封装成 `NTLMSSP-Auth` 发给 S。
4. S 收到 `NTLMSSP-Auth`，取出 `Net-NTLM Hash(Client)`。然后用自己的账户密码对 `Challenge` 值进行加密，得到一个 `Net-NTLM Hash(Server)` ，两者进行对比，相同的话就成功。

### 抓包

#### 数据包分析

环境

- 本地 IP：`192.168.51.192`
- 目的 IP：`192.168.111.140`
  - 用户 1：`trtyr:root`
  - 用户 2：`administrator:root`

使用命令

```shell
net use \\192.168.111.140\IPC$ /u:trtyr 123456
```

![](https://img.trtyr.top/images/blog/NTLM%20%E5%8D%8F%E8%AE%AE%E8%AE%A4%E8%AF%81%E8%BF%87%E7%A8%8B/004%20NTLM%20%E5%8D%8F%E8%AE%AE%E8%AE%A4%E8%AF%81-1.webp)

因为密码错误，所以无法登录，我们查看流量信息

![](https://img.trtyr.top/images/blog/NTLM%20%E5%8D%8F%E8%AE%AE%E8%AE%A4%E8%AF%81%E8%BF%87%E7%A8%8B/004%20NTLM%20%E5%8D%8F%E8%AE%AE%E8%AE%A4%E8%AF%81-2.webp)

我们看 NTLM 的认证过程内的数据包

![](https://img.trtyr.top/images/blog/NTLM%20%E5%8D%8F%E8%AE%AE%E8%AE%A4%E8%AF%81%E8%BF%87%E7%A8%8B/004%20NTLM%20%E5%8D%8F%E8%AE%AE%E8%AE%A4%E8%AF%81-3.webp)

可以看到 SMB 中封装的 NTLM 是在 `GSS-API` 里的

`GSS-API` 是 `通用安全服务应用接口`，是一种统一的模式，为使用者提供与机制无关、平台无关、程序语言环境无关且可移植的安全服务。而 `SSPI` 是 `GSS-API` 的一个专有变体。

可以看到这个包是 `Type 1` 类型的 `Negotiate` 消息。下一个包是 `Type 2` 的 `Challenge` 消息

![](https://img.trtyr.top/images/blog/NTLM%20%E5%8D%8F%E8%AE%AE%E8%AE%A4%E8%AF%81%E8%BF%87%E7%A8%8B/004%20NTLM%20%E5%8D%8F%E8%AE%AE%E8%AE%A4%E8%AF%81-4.webp)

这里有目标主机的主机名以及 `Challenge` 值，这里为 `603336b1820aa7ed` 。下一个包是 `Type 3` 的 `Auth` 消息，由于无法长截图，这里直接放内容

```
NTLM Secure Service Provider
    NTLMSSP identifier: NTLMSSP
    NTLM Message Type: NTLMSSP_AUTH (0x00000003)
    Lan Manager Response: 000000000000000000000000000000000000000000000000
        Length: 24
        Maxlen: 24
        Offset: 128
    LMv2 Client Challenge: 0000000000000000
    NTLM Response […]: a0b2c41942ae54445754757f14c5d42a01010000000000007e099ccabc56db01cb74181150fcc1ac0000000002001e00570049004e002d005000360039004a00560039004600510044004400350001001e00570049004e002d005000360039004a005600390046005100440044
        Length: 324
        Maxlen: 324
        Offset: 152
        NTLMv2 Response […]: a0b2c41942ae54445754757f14c5d42a01010000000000007e099ccabc56db01cb74181150fcc1ac0000000002001e00570049004e002d005000360039004a00560039004600510044004400350001001e00570049004e002d005000360039004a0056003900460051004400
            NTProofStr: a0b2c41942ae54445754757f14c5d42a
            Response Version: 1
            Hi Response Version: 1
            Z: 000000000000
            Time: Dec 25, 2024 11:04:39.062566200 UTC
            NTLMv2 Client Challenge: cb74181150fcc1ac
            Z: 00000000
            Attribute: NetBIOS domain name: WIN-P69JV9FQDD5
            Attribute: NetBIOS computer name: WIN-P69JV9FQDD5
            Attribute: DNS domain name: WIN-P69JV9FQDD5
            Attribute: DNS computer name: WIN-P69JV9FQDD5
            Attribute: Timestamp
            Attribute: Flags
            Attribute: Restrictions
            Attribute: Channel Bindings
            Attribute: Target Name: cifs/192.168.111.140
            Attribute: End of list
            padding: 00000000
    Domain name: NULL
    User name: trtyr
    Host name: DESKTOP-1P8PCA2
    Session Key: bdf18714ec94d6d0ca479c77078814cc
     […]Negotiate Flags: 0xe2888215, Negotiate 56, Negotiate Key Exchange, Negotiate 128, Negotiate Version, Negotiate Target Info, Negotiate Extended Session Security, Negotiate Always Sign, Negotiate NTLM key, Negotiate Sign, Request Targe
    Version 10.0 (Build 19041); NTLM Current Revision 15
    MIC: 2d3182783c14ecdcf6cb5df9bcf65bfb
```

这里看到 `LMv2 Client Challenge: 0000000000000000`；客户端要登陆的用户 `User name: trtyr`，客户端的主机名 `Host name: DESKTOP-1P8PCA2` 以及 SSP 生成的一个 `Session Key: bdf18714ec94d6d0ca479c77078814cc`。

在 `NTLMv2 Response` 下有一个 `NTProofStr: a0b2c41942ae54445754757f14c5d42a`，这个是数据签名用的 `HMAC-MD5` 值，目的是为了保证数据的完整性。

最后有一个 `MIC: 2d3182783c14ecdcf6cb5df9bcf65bfb`。关于这个 `MIC`，微软为了防止数据包中途被篡改，使用 `exportedSessionKey` 加密三个 NTLM 消息来保证数据包的完整性

```
MIC = HMAC_MD5(exportedSessionKey, Negotiate_Message + Challenge_Message + Auth_Message)
NTLM v2 Hash = HMAC-MD5(Unicode(hex((upper(UserName) + DomainName))), NTLM Hash)
NTProofStr = HMAC-MD5(Challenge + blob, NTLMv2 Hash)
```

之后就是返回认证结果了，这里是认证失败

![](https://img.trtyr.top/images/blog/NTLM%20%E5%8D%8F%E8%AE%AE%E8%AE%A4%E8%AF%81%E8%BF%87%E7%A8%8B/004%20NTLM%20%E5%8D%8F%E8%AE%AE%E8%AE%A4%E8%AF%81-5.webp)

我们重新运行命令

```
net use \\192.168.111.140\IPC$ /u:trtyr root
```

![](https://img.trtyr.top/images/blog/NTLM%20%E5%8D%8F%E8%AE%AE%E8%AE%A4%E8%AF%81%E8%BF%87%E7%A8%8B/004%20NTLM%20%E5%8D%8F%E8%AE%AE%E8%AE%A4%E8%AF%81-6.webp)

此时成功建立连接

#### Session Key 作用

`Session Key` 是用于密钥协商，生成代码可参考 `ntlm.py` 文件

```python
def generateEncryptedSessionKey(keyExchangeKey, exportedSessionKey):
   cipher = ARC4.new(keyExchangeKey)
   cipher_encrypt = cipher.encrypt

   sessionKey = cipher_encrypt(exportedSessionKey)
   return sessionKey
```

该函数接收两个参数 `keyExchangeKey` 和 `exportedSessionKey`。我们看一下函数的调用

```python
encryptedRandomSessionKey = generateEncryptedSessionKey(keyExchangeKey, exportedSessionKey)
```

可以看到，`encryptedRandomSessionKey` 就是流量里生成的 `Session Key`，然后传递的两个实参分别是 `keyExchangeKey` 和 `exportedSessionKey`

其中 `keyExchangeKey` 的调用和生成代码如下

```python
# 调用代码
keyExchangeKey = KXKEY(ntlmChallenge['flags'], sessionBaseKey, lmResponse, ntlmChallenge['challenge'], password,
                           lmhash, nthash, use_ntlmv2)

# 生成代码
def KXKEY(flags, sessionBaseKey, lmChallengeResponse, serverChallenge, password, lmhash, nthash, use_ntlmv2 = USE_NTLMv2):
   if use_ntlmv2:
       return sessionBaseKey

   if flags & NTLMSSP_NEGOTIATE_EXTENDED_SESSIONSECURITY:
       if flags & NTLMSSP_NEGOTIATE_NTLM:
          keyExchangeKey = hmac_md5(sessionBaseKey, serverChallenge + lmChallengeResponse[:8])
       else:
          keyExchangeKey = sessionBaseKey
   elif flags & NTLMSSP_NEGOTIATE_NTLM:
       if flags & NTLMSSP_NEGOTIATE_LM_KEY:
           keyExchangeKey = __DES_block(LMOWFv1(password, lmhash)[:7], lmChallengeResponse[:8]) + __DES_block(
               LMOWFv1(password, lmhash)[7] + b'\xBD\xBD\xBD\xBD\xBD\xBD', lmChallengeResponse[:8])
       elif flags & NTLMSSP_REQUEST_NON_NT_SESSION_KEY:
          keyExchangeKey = LMOWFv1(password,lmhash)[:8] + b'\x00'*8
       else:
          keyExchangeKey = sessionBaseKey
   else:
       raise Exception("Can't create a valid KXKEY!")

   return keyExchangeKey

```

可以看到，在 `keyExchangeKey` 的生成过程中，需要知道用户密码 `password`。再看一下 `exportedSessionKey` 的调用和生成

```python
exportedSessionKey = b("".join([random.choice(string.digits+string.ascii_letters) for _ in range(16)]))
encryptedRandomSessionKey = generateEncryptedSessionKey(keyExchangeKey, exportedSessionKey)
```

可以发现，`exportedSessionKey` 是随机数。

那么 `Sessiop key` 是如何进行协商的呢？

1. 客户端随机生成一个 `exportedSessionKey`，然后以 `keyExchangeKey` 为 key，进行 `generateEncryptedSessionKey()` 函数运算，得到 `Session key`。
2. 服务端得到 `Session Key`，用用户密码和缓存的 `Challenge` 生成 `keyExchangeKey`，然后 `keyExchangeKey` 和 `Session key` 进行运算，得到 `exportedSessionKey`

这样客户端和服务端都有了相同的 `exportedSessionKey`，此时就可以计算得到 `MIC`

```
MIC = HMAC_MD5(exportedSessionKey, Negotiate_Message + Challenge_Message + Auth_Message)
```

只要不知道用户密码，就无法得到 `exportedSessionKey` 以及 `MIC`。

#### Net-NTLM Hash 计算

我们使用 `Reponseder` 工具对 Response 进行抓取，得到如下数据

```
administrator:::1a892c22a57afeb4:26306F6B05F72D97D3EF0C5277C5D060:0101000000000000002342ABB156DB0148A6E0EC2ADCF4800000000002000800490030005800380001001E00570049004E002D0057005A00300037004500380050004A0044003400460004003400570049004E002D0057005A00300037004500380050004A004400340046002E0049003000580038002E004C004F00430041004C000300140049003000580038002E004C004F00430041004C000500140049003000580038002E004C004F00430041004C0007000800002342ABB156DB010600040002000000080030003000000000000000000000000030000081DFABB70AC6CE1A0F7861740C0D7072BDAC3EBC28A4BD2CA03BED00341AFA6E0A001000000000000000000000000000000000000900280063006900660073002F003100390032002E003100360038002E003100310031002E003100340031000000000000000000
```

这就是 `Net-NTLM Hash` 格式的 Response。`Net-NTLM Hash v2` 的格式为：

```
username::domain:challenge:HMAC-MD5:blob

username: administrator
domain:
challenge: 1a892c22a57afeb4
HMAC-MD5: 26306F6B05F72D97D3EF0C5277C5D060
blob: 0101000000000000002342ABB156DB0148A6E0EC2ADCF4800000000002000800490030005800380001001E00570049004E002D0057005A00300037004500380050004A0044003400460004003400570049004E002D0057005A00300037004500380050004A004400340046002E0049003000580038002E004C004F00430041004C000300140049003000580038002E004C004F00430041004C000500140049003000580038002E004C004F00430041004C0007000800002342ABB156DB010600040002000000080030003000000000000000000000000030000081DFABB70AC6CE1A0F7861740C0D7072BDAC3EBC28A4BD2CA03BED00341AFA6E0A001000000000000000000000000000000000000900280063006900660073002F003100390032002E003100360038002E003100310031002E003100340031000000000000000000
```

计算方式如下

- 大写的 `Uername` 和 `Domain` 拼接一起进行十六进制转换，然后对这个十六进制字节进行双字节 `Unicode` 编码得到 `data`
- 使用 `16B` 的 `NTLM Hash` 值作为密钥 `Key`，用 `key` 和 `data` 进行 `HMAC-MD5` 运算。这样就得到了 `NTLM V2 Hash`
- 构建一个 `blob` 信息
- 将 `Challenge` 和 `blob` 拼接在一起，得到新值 `CB`。以 `NTLM V2 Hash` 为密钥，对 `CB` 进行 `HMAC-MD5` 加密，得到 `NTProofStr`
- `NTProofStr` 和 `blog` 拼接在一起得到 `Response`

---

$data = Unicode(hex(upper(Uername) + Domain))$

$NTLM\ V2\  Hash = HMAC-MD5(data, NTLM\ Hash)$

$CB = Challenge + blob$

$NTProofStr = HMAC-MD5(CB, NTLM\ V2 \ Hash)$

$Reponse = NTProffStr + blob$

---

我们抓包，再看看

```
administrator:::7556e1b97541f816:6DF6E2A6074F68CB81C38660E3456F21:0101000000000000002B634A4357DB01EC890FC6E01426B60000000002000800530044005800550001001E00570049004E002D003900450031005000360039003400440041004400460004003400570049004E002D00390045003100500036003900340044004100440046002E0053004400580055002E004C004F00430041004C000300140053004400580055002E004C004F00430041004C000500140053004400580055002E004C004F00430041004C0007000800002B634A4357DB01060004000200000008003000300000000000000000000000003000001ED44C3A70FE31BED185F88318FCD343E4A68F6EEFF82FD870577466086CEDEA0A001000000000000000000000000000000000000900280063006900660073002F003100390032002E003100360038002E003100310031002E003100340031000000000000000000
```

![](https://img.trtyr.top/images/blog/NTLM%20%E5%8D%8F%E8%AE%AE%E8%AE%A4%E8%AF%81%E8%BF%87%E7%A8%8B/004%20NTLM%20%E5%8D%8F%E8%AE%AE%E8%AE%A4%E8%AF%81-7.webp)

我们把流量内容提取出来

```
NTLM Server Challenge: 7556e1b97541f816

NTProofStr: 6df6e2a6074f68cb81c38660e3456f21
```

上下对比，可以看到格式的具体情况。下面是 `Response` 的生成代码

```python
import hashlib
import hmac


def unicode_hex(data):
    """
    将输入字符串转换为 Unicode，然后编码为十六进制。
    """    return data.encode('utf-16le')


def md4_hash(data):
    """
    计算数据的 MD4 哈希。
    """    md4 = hashlib.new('md4')
    md4.update(data)
    return md4.digest()


def calculate_ntlm_hash(password):
    """
    计算 NTLM Hash。

    :param password: 密码 (字符串)
    :return: NTLM Hash (bytes)
    """    return md4_hash(password.encode('utf-16le'))


def hmac_md5(key, data):
    """
    执行 HMAC-MD5 哈希运算。
    """    return hmac.new(key, data, hashlib.md5).digest()


def calculate_ntlmv2_response(username, domain, ntlm_hash, server_challenge, blob):
    """
    计算 NTLMv2 响应。

    :param username: 用户名 (字符串)
    :param domain: 域名 (字符串)
    :param ntlm_hash: 16 字节的 NTLM 哈希值 (bytes)    :param server_challenge: 8 字节的服务器挑战 (bytes)    :param blob: 预构造的 NTLM blob (bytes)    :return: NTLMv2 响应 (bytes)    """    # 第 1 步：准备数据，将用户名转为大写并与域名拼接，再转换为 Unicode 编码的十六进制。
    data = unicode_hex(username.upper() + domain)

    # 第 2 步：计算 NTLMv2 哈希。
    ntlmv2_hash = hmac_md5(ntlm_hash, data)

    # 第 3 步：将服务器挑战和 blob 拼接，形成 CB。
    cb = server_challenge + blob

    # 第 4 步：计算 NTProofStr。
    nt_proof_str = hmac_md5(ntlmv2_hash, cb)

    # 第 5 步：将 NTProofStr 和 blob 拼接，得到最终的响应。
    response = nt_proof_str + blob

    return response

username = "administrator"
domain = ""
password = "root"  # 替换为实际密码
challenge = "7556e1b97541f816"

# 计算 NTLM Hashntlm_hash = calculate_ntlm_hash(password)

server_challenge = bytes.fromhex(challenge)
blob = bytes.fromhex(
    "0101000000000000002B634A4357DB01EC890FC6E01426B60000000002000800530044005800550001001E00570049004E002D003900450031005000360039003400440041004400460004003400570049004E002D00390045003100500036003900340044004100440046002E0053004400580055002E004C004F00430041004C000300140053004400580055002E004C004F00430041004C000500140053004400580055002E004C004F00430041004C0007000800002B634A4357DB01060004000200000008003000300000000000000000000000003000001ED44C3A70FE31BED185F88318FCD343E4A68F6EEFF82FD870577466086CEDEA0A001000000000000000000000000000000000000900280063006900660073002F003100390032002E003100360038002E003100310031002E003100340031000000000000000000"
)

# 生成 NTLMv2 响应
response = calculate_ntlmv2_response(username, domain, ntlm_hash, server_challenge, blob)

print("NTLMv2 Response: ", str(response.hex()).upper())
```

## 域环境下的 NTLM 认证

域环境下的 NTLM 认证和工作组其实差不了太多。

现在环境如下

- 域名：`trtyr.top`
- `Win2012` 域控 ：`192.168.10.132`
- `Win7` 域主机
  - IP： `192.168.10.136`
  - 主机名： `WIN7D`
- `Win10` 非域主机：`192.168.10.134`

`Win10` 现在想要访问 `Win7` 的资源，也是同样的，两者之间建立 `type 1`，`type 2`，`type 3` 消息。在工作组中，`type 3` 消息发给对端后，对端进行认证，然后把结果发给请求方；但是在域中，对端收到 `type 3`，会通过 `netlogn` 协议将其发给 DC，在 DC 处去对比 `Net-NTLM Hash`，然后 DC 把结果发给对端，对端再发给请求方。

![](https://img.trtyr.top/images/blog/NTLM%20%E5%8D%8F%E8%AE%AE%E8%AE%A4%E8%AF%81%E8%BF%87%E7%A8%8B/004%20NTLM%20%E5%8D%8F%E8%AE%AE%E8%AE%A4%E8%AF%81-8.webp)

查看流量。由于常规方法的话，域内用的 `kerberos` 协议，这里使用 `psexec` 工具。

```shell
 ./PsExec64.exe \\192.168.10.136 -u TRTYR\administrator -p Admin!123 -i cmd
```

![](https://img.trtyr.top/images/blog/NTLM%20%E5%8D%8F%E8%AE%AE%E8%AE%A4%E8%AF%81%E8%BF%87%E7%A8%8B/004%20NTLM%20%E5%8D%8F%E8%AE%AE%E8%AE%A4%E8%AF%81-9.webp)

可以看到，中间 `DCEPRC` 的部分，`Win7` 开始和域控建立的连接。

具体的内容和工作组环境的大差不差
