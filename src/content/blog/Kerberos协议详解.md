---
title: Kerberos协议详解
description: Kerberos协议详解
pubDate: 01 10 2025
image: https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/003%20Kerberos认证流程-24.webp
categories:
  - 网络安全
tags:
  - 网络协议
---

# Kerberos 基础

Kerberos 是希腊神话中的地狱三头犬。和那条犬有三个头一样，Kerberos 协议也有三个"头"

- 客户端
- 服务端
- Key Distribution Center 密钥分发中心

Kerberos 协议是为了解决，**“我如何证明我是我”** 的一个问题。

首先是关于“我如何证明我是我”。现在又两个角色：客户端 C 和服务器 S，C 和 S 互相没建立过实际联系，也就是说 C 和 S 互相不认识。现在 C 向 S 发起一个请求，C 把携带自己身份信息的数据包发送给 S。

现在就出现了一个问题，一个你素未谋面的人跑到你面前跟你说，我是秦始皇，v 我 50，鬼信啊。所以对于 S 来说，这个 C 的身份认证是无法进行的。同理 C 也无法认证 S 的身份。

Kerberos 引入了一个第三方 `KDC`，客户端想要访问服务端的某个服务，首先需要购买**服务端认可**的 `ST` (Service Ticket，服务票据)。也就是说，客户端在访问服务之前需要先买好票，等待服务验票之后才能访问。但是这张票并不能直接购买，需要一张 `TGT` (Ticket Granting Ticket，认购权证)。也就是说，客户端在买票之前必须先获得一张 `TGT`。

`KDC` 有两个模块：`AS` 和 `TGT`。`AS` 是来发放 `TGT` 的，`TGS` 是来发放 `ST` 的。所以说客户端的大体请求过程如下

1. 客户端请求 `KDC` 中的 `AS`，`AS` 对客户端进行认证，如果认证成功，`AS` 将给客户端发送一份 `TGT` 票据，票据里有请求 TGT 用户的信息
2. 客户端收到 `TGT` 票据后，拿着 TGT 再次向 KDC 中的TGS 发起请求。TGS 会检查 `TGT` 内用户身份和请求用户是否相同，如果认证成功，发给客户端发一份 `ST` 票据
3. 客户端收到 ST 后，拿着 `ST` 去请求服务端的服务。服务端看是否有用户所请求的 `Server IP`；检查 `ST` 内容与客户端身份

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/001%20Kerberos%20基础-3.webp)

根据这个图我们可以看到，整体可以分为三个模块

- `AS-Req` 和 `AS-Rep`
- `TGS-Req` 和 `TGS-Rep`
- `AP-Rep` 和 `AP-Rep`

`TGT` 和 `ST` 均是由 `KDC` 发放的，因为 `KDC` 运行在域控上，所以说 `TGT` 和 `ST` 均是由域控发放的。

Kerberos 使用 `TCP/UDP 88` 端口进行认证，使用 `TCP/UDP 464` 端口进行密码重设。

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/001%20Kerberos%20基础-4.webp)

# Kerberos中的PAC

在 Ker 最初的设计流程里，只说明了如何认证客户端的真实身份，并没有说明客户有没有权限去访问该服务，因为域中不同权限的用户能够访问的资源是不同的。微软为了解决这个问题引入了 `PAC`

`PAC` 是特权属性证书。`PAC` 包含各种授权信息、附加凭据信息、配置文件和策略信息等。例如用户所属的用户组、用户所具有的权限等。

在最初的 `RFC1510` 规定的标准 Kerberos 认证过程中并没有 `PAC`，微软在自己的产品所实现的 Kerberos 流程中加人了 `PAC` 的概念。由于在域中不同权限的用户能够访问的资源是不同的，因此微软设计 `PAC` 用来辨别用户身份和权限。

在一个正常的 Kerberos 认证流程中，`KDC` 返回的 `TGT` 和 `ST` 中都是带有 `PAC` 的。这样做的好处是在以后对资源的访问中，服务端接收到客户请求的时候不再需要借助 `KDC` 提供完整的授权信息来完成对用户权限的判断，而只需要根据请求中所包含的 `PAC` 信息直接与本地资源的 `ACL` 相比较来做出裁决。

## PAC 结构

### PAC 顶部结构

PAC 的顶部结构如下

```c
typedef unsigned long ULONG;
typedef unsigned short USHORT;
typedef unsigned __int64 ULONG64;
typedef unsigned char UCHAR;

typedef struct _PACTYPE {
   ULONG cBuffers;                 // 缓冲区的数量
   ULONG Version;                  // PAC 的版本号
   PAC_INFO_BUFFER Buffers[1];     // 一个缓冲区数组（动态长度）
} PACTYPE;

```

我们可以抓包获取。不过需要 `PAC` 是在 `TGT` 和 `ST` 里的，所以我们需要对流量进行解密。下面是解密后得到的流量数据

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/002%20Kerberos中的PAC-4.webp)

### PAC_INFO_BUFFER

在结构体里还有一个 `PAC_INFO_BUFFER` 结构，结构包含了关于PAC的每个部分的信息，这部分是最重要的，结构如下：

```C
typedef unsigned long ULONG;
typedef unsigned __int64 ULONG64;

typedef struct _PAC_INFO_BUFFER {
    ULONG ulType;       // 缓冲区类型
    ULONG cbBufferSize; // 缓冲区大小（字节）
    ULONG64 Offset;     // 缓冲区数据的偏移量（从 PAC 起始位置计算）
} PAC_INFO_BUFFER;
```

`ulType` 表示此缓冲区中包含的数据类型。以下是它的可能值及其含义：

- `Logon Info (1)`
  - `ulType` 的值为 `1` 表示该缓冲区包含登录信息。
  - 登录信息通常包括用户的登录时间、用户名等。
- `Client Info Type (10)`
  - `ulType` 的值为 `10` 表示该缓冲区包含客户端信息类型。
  - 客户端信息可能包括客户端的操作系统版本、硬件信息等。
- `UPN DNS Info (12)`
  - `ulType` 的值为 `12` 表示该缓冲区包含 UPN（User Principal Name）和 DNS（Domain Name System）信息。
  - 该信息可以帮助区分用户的标识符和他们在域中的 DNS 名称。
- `Server Checksum (6)`
  - `ulType` 的值为 `6` 表示该缓冲区包含服务器校验和。
  - 该缓冲区用于确保从服务器到客户端的数据完整性和一致性。
- `Privsvr Checksum (7)`
  - `ulType` 的值为 `7` 表示该缓冲区包含私有服务器校验和。
  - 与服务器校验和类似，但该缓冲区可能涉及私有服务器或独特的认证流程。

抓包得到内容如下

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/002%20Kerberos中的PAC-2.webp)

```
Type: Logon Info (1)
	Size: 456
	Offset: 88
	PAC_LOGON_INFO […]: 01100800ccccccccb801000000000000000002003c84a4334d62db01ffffffffffffff7fffffffffffffff7f44cd264ff457db01448d9079bd58db01444d8044f578db010a000a00040002000000000008000200000000000c000200000000001000020000000000140002000
Type: Client Info Type (10)
	Size: 20
	Offset: 544
	PAC_CLIENT_INFO_TYPE: 80d32a454d62db010a0074007200740079007200
Type: UPN DNS Info (12)
	Size: 72
	Offset: 568
	UPN_DNS_INFO: 1e001000120030000100000000000000740072007400790072004000740072007400790072002e0074006f0070000000540052005400590052002e0054004f005000000000000000
Type: Server Checksum (6)
	Size: 16
	Offset: 640
	PAC_SERVER_CHECKSUM: 10000000dbd3fb93dfb23131cc4abea2
Type: Privsvr Checksum (7)
	Size: 20
	Offset: 656
	PAC_PRIVSVR_CHECKSUM: 76ffffff8fa29f51afa4b7c644c502d8bd393ce3
```

#### PAC 凭证信息 (Logon Info)

`LOGON INFO` 类型的 `PAC_LOGON_INFO` 包含Kerberos票据客户端的凭据信息。

数据本身包含在一个`KERB_VALIDATION_INFO`结构中，该结构是由NDR编码的。NDR编码的输出被放置在`LOGON INFO`类型的`PAC_INFO_BUFFER`结构中。如下：

```C
typedef struct _KERB_VALIDATION_INFO {
   // 保留字段，表示时间信息
   FILETIME Reserved0;      // 文件时间戳 0
   FILETIME Reserved1;      // 文件时间戳 1
   FILETIME KickOffTime;    // 强制退出时间，用于限制用户会话的持续时间
   FILETIME Reserved2;      // 文件时间戳 2
   FILETIME Reserved3;      // 文件时间戳 3
   FILETIME Reserved4;      // 文件时间戳 4

   // 保留字段，表示 Unicode 字符串
   UNICODE_STRING Reserved5;  // 保留的 Unicode 字符串 5
   UNICODE_STRING Reserved6;  // 保留的 Unicode 字符串 6
   UNICODE_STRING Reserved7;  // 保留的 Unicode 字符串 7
   UNICODE_STRING Reserved8;  // 保留的 Unicode 字符串 8
   UNICODE_STRING Reserved9;  // 保留的 Unicode 字符串 9
   UNICODE_STRING Reserved10; // 保留的 Unicode 字符串 10

   // 保留字段，表示 16 位无符号整数
   USHORT Reserved11;        // 保留的 16 位无符号整数 11
   USHORT Reserved12;        // 保留的 16 位无符号整数 12

   // 用户的 ID 和组相关信息
   ULONG UserId;             // 用户 ID，代表用户的唯一标识
   ULONG PrimaryGroupId;     // 主组 ID，用户所属的主组
   ULONG GroupCount;         // 用户所属于的组数量
   [size_is(GroupCount)] PGROUP_MEMBERSHIP GroupIds; // 用户所属于的各组成员信息

   // 用户相关标志
   ULONG UserFlags;          // 用户状态或权限的标志

   // 保留字段，表示 32 位无符号整数数组
   ULONG Reserved13[4];      // 保留的 32 位无符号整数数组，包含 4 个元素

   // 保留的 Unicode 字符串
   UNICODE_STRING Reserved14; // 保留的 Unicode 字符串 14
   UNICODE_STRING Reserved15; // 保留的 Unicode 字符串 15

   // 登陆域的 SID（安全标识符）
   PSID LogonDomainId;       // 登陆域的 SID

   // 保留字段，表示 32 位无符号整数数组
   ULONG Reserved16[2];      // 保留的 32 位无符号整数数组，包含 2 个元素
   ULONG Reserved17;         // 保留的 32 位无符号整数 17

   // 保留字段，表示 32 位无符号整数数组
   ULONG Reserved18[7];      // 保留的 32 位无符号整数数组，包含 7 个元素

   // SID 相关信息
   ULONG SidCount;           // 与用户关联的 SID 数量
   [size_is(SidCount)] PKERB_SID_AND_ATTRIBUTES ExtraSids; // 额外的 SID 和相关属性

   // 资源组相关的 SID
   PSID ResourceGroupDomainSid; // 资源组的域 SID
   ULONG ResourceGroupCount;    // 资源组的 SID 数量
   [size_is(ResourceGroupCount)] PGROUP_MEMBERSHIP ResourceGroupIds; // 资源组成员信息
} KERB_VALIDATION_INFO;

```

流量如图

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/002%20Kerberos中的PAC-3.webp)

我们提取出来看看

```
PAC_LOGON_INFO:
    Referent ID: 0x00020000
    Logon Time: Jan  9, 2025 12:16:05.598521200 中国标准时间
        # 这是用户的登录时间，格式为“年 月 日 时 分 秒 微秒”，表示用户成功登录的时间。
    Logoff Time: Infinity (absolute time)
        # 登出时间设置为“无限”，表示未设置登出时间或不适用。
    Kickoff Time: Infinity (absolute time)
        # 强制退出时间设置为“无限”，意味着管理员无法强制中断此会话。
    PWD Last Set: Dec 27, 2024 08:14:34.914131600 中国标准时间
        # 密码的最后设置时间，即用户修改密码的时间。
    PWD Can Change: Dec 28, 2024 08:14:34.914131600 中国标准时间
        # 用户可以更改密码的时间。
    PWD Must Change: Feb  7, 2025 08:14:34.914131600 中国标准时间
        # 密码必须在此时间之前更改，否则将无法继续使用该账户。
    Acct Name: trtyr
        Length: 10
        Size: 10
        Character Array: trtyr
            Referent ID: 0x00020004
            Max Count: 5
            Offset: 0
            Actual Count: 5
            Acct Name: trtyr
        # 该字段对应用户的 sAMAccountName 属性值，用户在域中的主要登录名为“trtyr”。
    Full Name
        Length: 0
        Size: 0
        Character Array
            Referent ID: 0x00020008
            Max Count: 0
            Offset: 0
            Actual Count: 0
        # 此字段为空，通常对应于用户的 displayName 属性，用来表示用户的全名。
    Logon Script
        Length: 0
        Size: 0
        Character Array
            Referent ID: 0x0002000c
            Max Count: 0
            Offset: 0
            Actual Count: 0
        # 登陆脚本字段为空，通常用于指定用户登录时执行的脚本路径。
    Profile Path
        Length: 0
        Size: 0
        Character Array
            Referent ID: 0x00020010
            Max Count: 0
            Offset: 0
            Actual Count: 0
        # 用户的配置文件路径为空，通常存储在网络位置，包含用户的配置信息。
    Home Dir
        Length: 0
        Size: 0
        Character Array
            Referent ID: 0x00020014
            Max Count: 0
            Offset: 0
            Actual Count: 0
        # 用户的主目录路径为空，通常用于存储用户文件。
    Dir Drive
        Length: 0
        Size: 0
        Character Array
            Referent ID: 0x00020018
            Max Count: 0
            Offset: 0
            Actual Count: 0
        # 目录驱动器为空，表示未分配给用户的特定网络驱动器。
    Logon Count: 19
        # 用户的登录计数，表示用户已经成功登录了19次。
    Bad PW Count: 0
        # 错误密码计数，表示用户未因错误密码而被拒绝登录。
    User RID: 1001
        # 用户的 RID（相对标识符），是用户 SID 的一部分，唯一标识域中的用户。
    Group RID: 513
        # 用户所在组的 RID。`513` 对应于“Domain Users”组，所有域用户都会属于该组。
    Num RIDs: 1
        # 用户所属组的数量，本例中用户仅属于一个组。
    GroupIDs
        Referent ID: 0x0002001c
        Max Count: 1
        GROUP_MEMBERSHIP:
            Group RID: 513
            Group Attributes: 0x00000007
                .... .... .... .... .... .... .... ...1 = Mandatory: The MANDATORY bit is SET
                .... .... .... .... .... .... .... ..1. = Enabled By Default: The ENABLED_BY_DEFAULT bit is SET
                .... .... .... .... .... .... .... .1.. = Enabled: The ENABLED bit is SET
                .... .... .... .... .... .... .... 0... = Owner: The owner bit is NOT set
                ..0. .... .... .... .... .... .... .... = Resource Group: The resource group bit is NOT set
        # 该字段列出了用户所属的组（`Group RID = 513`），并且描述了该组的属性（如是否强制、是否默认启用等）。
    User Flags: 0x00000020
        # 用户标志位字段表示该用户的特殊属性。值 `0x00000020` 表示设置了“Extra SIDs”标志位。
    User Session Key: 00000000000000000000000000000000
        # 会话密钥，用于保护用户的身份验证信息，本例中为全零，表示未分配特定会话密钥。
    Server: WIN-04BJ6QOG2N1
        Length: 30
        Size: 32
        Character Array: WIN-04BJ6QOG2N1
            Referent ID: 0x00020020
            Max Count: 16
            Offset: 0
            Actual Count: 15
            Server: WIN-04BJ6QOG2N1
        # 表示用户登录的服务器名称。在本例中为 `WIN-04BJ6QOG2N1`。
    Domain: TRTYR
        Length: 10
        Size: 12
        Character Array: TRTYR
            Referent ID: 0x00020024
            Max Count: 6
            Offset: 0
            Actual Count: 5
            Domain: TRTYR
        # 表示用户所在的域名，为 `TRTYR`。
    SID pointer: S-1-5-21-697332047-570282633-840858215  (Domain SID)
        SID pointer: S-1-5-21-697332047-570282633-840858215  (Domain SID)
            Referent ID: 0x00020028
            Count: 4
            Domain SID: S-1-5-21-697332047-570282633-840858215  (Domain SID)
                Revision: 1
                Num Auth: 4
                Authority: 5
                Subauthorities: 21-697332047-570282633-840858215
        # 域 SID 指针，表示该用户所在域的 SID，格式为 `S-1-5-21-<subauthorities>`。
    Dummy1 Long: 0x00000000
    Dummy2 Long: 0x00000000
    User Account Control: 0x00000010
        # 用户账户控制字段，表示账户的一些安全属性。例如，`Normal Account` 表示该账户是普通账户。
        .... .... .... .... .... ..0. .... .... = Don't Require PreAuth: This account REQUIRES preauthentication
        .... .... .... .... 0... .... .... .... = Use DES Key Only: This account does NOT have to use_des_key_only
        .... .... .... .... .0.. .... .... .... = Not Delegated: This might have been delegated
        .... .... .... .... ..0. .... .... .... = Trusted For Delegation: This account is NOT trusted_for_delegation
        .... .... .... .... ...0 .... .... .... = SmartCard Required: This account does NOT require_smartcard to authenticate
        .... .... .... .... .... 0... .... .... = Encrypted Text Password Allowed: This account does NOT allow encrypted_text_password
        .... .... .... .... .... .0.. .... .... = Account Auto Locked: This account is NOT auto_locked
        .... .... .... .... .... ..0. .... .... = Don't Expire Password: This account might expire_passwords
        .... .... .... .... .... ...0 .... .... = Server Trust Account: This account is NOT a server_trust_account
        .... .... .... .... .... .... 0... .... = Workstation Trust Account: This account is NOT a workstation_trust_account
        .... .... .... .... .... .... .0.. .... = Interdomain trust Account: This account is NOT an interdomain_trust_account
        .... .... .... .... .... .... ..0. .... = MNS Logon Account: This account is NOT a mns_logon_account
        .... .... .... .... .... .... ...1 .... = Normal Account: This account is a NORMAL_ACCOUNT
        # 该字段的比特值表示账户的权限与安全设置。
    Dummy4 Long: 0x00000000
    Dummy5 Long: 0x00000000
    Dummy6 Long: 0x00000000
    Dummy7 Long: 0x00000000
    Dummy8 Long: 0x00000000
    Dummy9 Long: 0x00000000
    Dummy10 Long: 0x00000000
    Num Extra SID: 1
        # 有 1 个额外的 SID，表示账户的附加 SID。
    SID_AND_ATTRIBUTES_ARRAY:
        Referent ID: 0x0002002c
        SID_AND_ATTRIBUTES array:
            Max Count: 1
            SID_AND_ATTRIBUTES:
                SID pointer: S-1-18-1  (Authentication Authority Asserted Identity)
                    SID pointer: S-1-18-1  (Authentication Authority Asserted Identity)
                        Referent ID: 0x00020030
                        Count: 4
                        Domain SID: S-1-18-1  (Authentication Authority Asserted Identity)
                            Revision: 1
                            Num Auth: 1
                            Authority: 18
                            Subauthorities: 1
        # 额外的 SID 与认证相关，标识该用户属于特定的认证组。

```

提供的 `PAC_LOGON_INFO` 包含了有关用户登录数据的详细信息。以下是相关字段的解释和它们的含义：

关键字段解释：

- **Acct Name**：这个字段对应的是用户的 sAMAccountName 属性值，在本例中为 `trtyr`。这是用户在域中的主要登录名。
- **Full Name**：这个字段为空，但通常它对应的是 `displayName` 属性，代表用户的全名。
- **User RID**：`User RID`（相对标识符）是用户 SID 的一部分。`User RID` 的值是 `1001`，它是 SID 的最后一部分，唯一标识域中的用户。
- **Group RID**：`Group RID` 表示用户所属的特定组的 RID。在本例中，`Group RID` 的值是 `513`，对应的是“Domain Users”组。
- **Num RIDs**：表示用户所属的组的数量。在此例中，用户所属 1 个组。
- **GroupIDs**：此字段列出了用户所属的所有组的 RID。用户所属的组为 `Group RID = 513`，即“Domain Users”组。

其他信息：

- **Logon Time**：用户登录时间为 `2025年1月9日 12:16:05.598521200 中国标准时间`。
- **Logoff Time**：设置为 `Infinity`，表示未设置注销时间或不适用。
- **Kickoff Time**：同样设置为 `Infinity`，表示会话不能被管理员强制终止。
- **PWD Last Set**：密码最后设置时间为 `2024年12月27日 08:14:34.914131600 中国标准时间`。
- **PWD Can Change**：用户可以更改密码的时间为 `2024年12月28日`。
- **PWD Must Change**：密码必须更改的时间为 `2025年2月7日`。
- **User Flags**：`User Flags` 字段的值为 `0x00000020`，该值的各个比特字段表示具体含义：
  - **Extra SIDs bit is SET**：表示用户有额外的 SID。
- **User Session Key**：会话密钥设置为 `00000000000000000000000000000000`，表示没有分配特定的会话密钥。
- **Server**：登录发生的服务器名称为 `WIN-04BJ6QOG2N1`。
- **Domain**：域名为 `TRTYR`。
- **SID pointer**：指向域 SID `S-1-5-21-697332047-570282633-840858215`。
- **User Account Control**：该字段表示账户的各种属性，包括：
  - **Normal Account**：这是一个普通用户账户。
  - **Don't Require PreAuth**：账户要求预身份验证。
  - **Account Disabled**：账户未被禁用。
- **Num Extra SID**：有 1 个额外的 SID，关联到 "Authentication Authority Asserted Identity"（SID `S-1-18-1`），表示账户属于一个特定的认证组。

#### PAC 签名 (Checksum)

这里涉及到 `Server Checksum` 和 `Privsvr Checksum`。`Server Checksum` 是使用服务密钥进行签名，而 `Privsvr Checksum` 是使用KDC密钥进行签名。

签名有两个原因。

- 存在带有服务密钥的签名，以验证此PAC由服务进行了签名
- 带有KDC密钥的签名是为了防止不受信任的服务用无效的PAC为自己伪造票据。

签名有两个原因。首先，存在带有服务密钥的签名，以验证此PAC由服务进行了签名。其次，带有KDC密钥的签名是为了防止不受信任的服务用无效的PAC为自己伪造票据。

这两个签名分别以 `PAC_SERVER_CHECKSUM` 和 `PAC_PRIVSVR_CHECKSUM` 类型的 `PAC_INFO_BUFFER` 发送。

在PAC数据用于访问控制之前，必须检查 `PAC_SERVER_CHECKSUM` 签名。这将验证客户端是否知道服务的密钥。而 `PAC_PRIVSVR_CHECKSUM` 签名的验证是可选的，默认不开启。它用于**验证PAC是否由KDC签发**，而不是由KDC以外的具有访问服务密钥的人放入票据中。

结构体如下

```C
typedef struct _PAC_SIGNATURE_DATA {
    ULONG SignatureType;  // 签名类型，标识签名的类型（如PAC_SERVER_CHECKSUM或PAC_PRIVSVR_CHECKSUM）
    UCHAR Signature[1];   // 签名内容，是一个字节数组，存储实际的签名
} PAC_SIGNATURE_DATA, *PPAC_SIGNATURE_DATA;

```

- `SignatureType`：表示签名的类型，例如，`PAC_SERVER_CHECKSUM` 或 `PAC_PRIVSVR_CHECKSUM`。
- `Signature`：存储签名的字节数组，长度为1个字节（但实际可能包含多个字节）。

流量如下

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/002%20Kerberos中的PAC-5.webp)

提取信息

```
Type: Server Checksum (6)
    Size: 16
    Offset: 640
    PAC_SERVER_CHECKSUM: 10000000dbd3fb93dfb23131cc4abea2
        Type: 16
        Signature: dbd3fb93dfb23131cc4abea2
/*
解释：
PAC_SERVER_CHECKSUM 是由服务端使用服务密钥签名的值。它用于确保该PAC数据是由服务端发出的并且未被篡改。
- Type: 16 表示这是一个服务器签名。
- Signature 是实际的签名值，帮助验证数据的完整性和来源。
*/

Type: Privsvr Checksum (7)
    Size: 20
    Offset: 656
    PAC_PRIVSVR_CHECKSUM: 76ffffff8fa29f51afa4b7c644c502d8bd393ce3
        Type: -138
        Signature: 8fa29f51afa4b7c644c502d8bd393ce3
/*
解释：
PAC_PRIVSVR_CHECKSUM 是由KDC（密钥分发中心）密钥签名的值。它用于确保该PAC数据确实是由KDC发出的，而不是由不受信任的实体伪造或篡改的。
- Type: -138 表示这是一个KDC签名。
- Signature 是实际的签名值，用于验证PAC的来源和完整性。
*/

```

## KDC 如何验证 PAC

KDC 验证 PAC，主要是靠那两个 PAC 签名

- 服务密钥签名 `PAC_SERVER_CHECKSUM`
- KDC 密钥签名 `PAC_PRIVSVR_CHECKSUM`

在客户端拿着 `ST` 去请求服务端时，向服务端发送 `AP-REQ`

服务端收到客户端发来的 `AP-REQ` 消息时，只能校验 `PAC_SERVER_CHECKSUM` 签名，而并不能校验 `PAC_PRIVSVR_CHECKSUM` 签名。因为 `PAC_PRIVSVR_CHECKSUM` 签名是 `KDC` 去签名认证的，所以如果要验证 `PAC_PRIVSVR_CHECKSUM` 签名，服务端还需要把 `ST` 里的 `PAC` 发给 `KDC` 验证。大部分服务默认并没有 `KDC` 验证 `PAC` 这一步。

那么如何配置服务主机开启 KDC 签名校验呢，根据微软官方文档的描述，若要开启 KDC 校验 PAC，需要有以下条件：

- 应用程序具有 `SeTcbPrivilege` 权限。`SeTcbPrivilege` 权限允许为用户帐户分配“作为操作系统的一部分”。本地系统、网络服务和本地服务帐户都是由 Windows 定义的服务用户帐户。每个帐户都有一组特定的特权。
- 应用程序是一个服务，验证 `KDC PAC` 签名的注册表项被设置为 1，默认为 0。修改方法如下
  - 启动注册表编辑器 `regedit.exe`
  - 找到以下子键：`HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Lsa\Kerberos\Parameters`
  - 添加一个 `ValidateKdcPacSignature` 的键值 (DWORD类型)。该值为0时，不会进行 `KDC PAC` 校验。该值为 1 时，会进行 `KDC PAC` 校验。因此可以将该值设置为 1 启用 `KDC PAC` 校验。

对于验证 KDC PAC 签名这个注册表键值，有以下几点注意事项：

- 如果服务端并非一个服务程序，而是一个普通应用程序，它将不受以上注册表的影响，而总是进行 `KDC PAC` 校验。
- 如果服务端并非一个程序，而是一个驱动，其认证过程在系统内核内完成，它将不受以上注册表的影响，而永不进行 `PAC` 校验。
- 使用以上注册表项，需要在 `Windows Server 2003 SP2` 或更新的操作系统。
- 在运行 `Windows Server 2008` 或更新操作系统的服务器上，该注册表项的值缺省为 0 (默认没有该 `ValidateKdcPacSignature` 键值)，也就是不进行 `KDC PAC` 校验。

需要说明的是，注册在本地系统帐户下的服务无论如何配置，都不会触发 `KDC` 验证 `PAC` 签名。也就是说譬如 `SMB`、`CIFS`、`HOST` 等服务无论如何都不会触发 `KDC` 验证 `PAC` 签名。

大体的流程如下

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/002%20Kerberos中的PAC-6.webp)

## PAC 在 Kerberos 中的优缺点

没有 PAC 是这样的

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/Pasted image 20250109143630.webp)

有 PAC 后变成了这样

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/002%20Kerberos中的PAC-8.webp)

客户端在访问网络资源的时候，服务端不再需要向 KDC 查询授权信息，而是直接在本地进行 PAC 信息与 ACL 的比较。从而节约了网络资源。

但是 PAC 在用户的认证阶段引入会导致认证耗时过长。

`Windows Kerberos` 客户端会通过 `RPC` 调用 `KDC` 上的函数来验证 `PAC` 信息，这时候用户会观察到在服务器端与 `KDC` 之间的 `RPC` 包流量的增加。而另一方面，由于 `PAC` 是微软特有的一个特性，所以启用了 `PAC` 的域中将不支持装有其他操作系统的服务器，制约了域配置的灵活性。

并且在2014年，由于`PAC`的安全性导致产生了一个域内极其严重的提权漏洞 `MS14-068`

# Kerberos认证流程

环境如下

- DC：`192.168.10.132`
- 域主机 A（WIN7）：`192.168.10.145`
- 域主机 B： `192.168.10.134`

现在在域主机 B 上运行命令

```
net use \\WIN7 /u:TRTYR\trtyr root
```

得到如下流量

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/003%20Kerberos认证流程-1.webp)

我们开始分析

## AS

首先第一阶段，是客户端从 `AS` 那里请求 `TGT`。域主机 B 向 DC 发起请求。

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/003%20Kerberos认证流程-2.webp)

### AS-REQ 分析

当域内某个用户想要访问域内某个服务时，于是输入用户名和密码，本机就会向 `KDC` 的 `AS` 认证服务发送一个 `AS-REQ` 认证请求

流量如下

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/003%20Kerberos认证流程-3.webp)

流量信息如下

```
as-req
    pvno: 5  # Kerberos协议版本号为5
    msg-type: krb-as-req (10)  # 消息类型，表示这是一个认证服务请求（AS-REQ），类型为10
    padata: 2 items  # padata包含2个项目，padata用于传输预认证数据

    # 第一项 pA-ENC-TIMESTAMP（加密时间戳数据）
    PA-DATA pA-ENC-TIMESTAMP
        padata-type: pA-ENC-TIMESTAMP (2)  # 数据类型是pA-ENC-TIMESTAMP
        padata-value: 303da003020117a23604346ea9e3cdc92513f7847198bc86ec83b7daab88dfb3a9dc527598b6e45b8c7bcfc46068b6720931039de0708b1c6dc93d0c10d734
            etype: eTYPE-ARCFOUR-HMAC-MD5 (23)  # 加密算法类型为ARCFOUR-HMAC-MD5，类型编号为23
            cipher: 6ea9e3cdc92513f7847198bc86ec83b7daab88dfb3a9dc527598b6e45b8c7bcfc46068b6720931039de0708b1c6dc93d0c10d734
                # 这是加密的时间戳数据，使用前面提到的加密算法进行加密

    # 第二项 pA-PAC-REQUEST（PAC请求数据）
    PA-DATA pA-PAC-REQUEST
        padata-type: pA-PAC-REQUEST (128)  # 数据类型是pA-PAC-REQUEST，表示请求包含PAC
        padata-value: 3005a0030101ff
            include-pac: True  # 表示请求中需要包含PAC数据，用于进行后续验证

    req-body  # 请求主体，包含Kerberos认证请求的核心信息
        Padding: 0  # 填充字段，通常用于确保请求的对齐
        kdc-options: 40810010  # KDC选项，指定请求的附加功能和特性
            0... .... = reserved: False  # 保留位，不使用
            .1.. .... = forwardable: True  # 请求的票据是否可以转发
            ..0. .... = forwarded: False  # 票据是否已被转发
            ...0 .... = proxiable: False  # 票据是否可以作为代理使用
            .... 0... = proxy: False  # 票据是否为代理票据
            .... .0.. = allow-postdate: False  # 是否允许使用已过期的票据
            .... ..0. = postdated: False  # 请求是否为后期日期票据
            .... ...0 = unused7: False  # 保留字段
            1... .... = renewable: True  # 请求的票据是否可以续期
            .0.. .... = unused9: False  # 保留字段
            ..0. .... = unused10: False  # 保留字段
            ...0 .... = opt-hardware-auth: False  # 是否进行硬件认证
            .... 0... = unused12: False  # 保留字段
            .... .0.. = unused13: False  # 保留字段
            .... ..0. = constrained-delegation: False  # 是否启用受限委派
            .... ...1 = canonicalize: True  # 是否启用规范化（用于标准化请求）
            0... .... = request-anonymous: False  # 请求是否匿名
            .0.. .... = unused17: False  # 保留字段
            ..0. .... = unused18: False  # 保留字段
            ...0 .... = unused19: False  # 保留字段
            .... 0... = unused20: False  # 保留字段
            .... .0.. = unused21: False  # 保留字段
            .... ..0. = unused22: False  # 保留字段
            .... ...0 = unused23: False  # 保留字段
            0... .... = unused24: False  # 保留字段
            .0.. .... = unused25: False  # 保留字段
            ..0. .... = disable-transited-check: False  # 是否禁用中转检查
            ...1 .... = renewable-ok: True  # 是否允许续期票据
            .... 0... = enc-tkt-in-skey: False  # 是否使用加密票据
            .... .0.. = unused29: False  # 保留字段
            .... ..0. = renew: False  # 是否请求续期票据
            .... ...0 = validate: False  # 是否验证票据

        cname  # 客户端名称字段
            name-type: kRB5-NT-PRINCIPAL (1)  # 客户端名称类型为Kerberos主名称类型（kRB5-NT-PRINCIPAL）
            cname-string: 1 item  # 客户端名称字符串，包含1个条目
                CNameString: trtyr  # 请求的用户名为“trtyr”

        realm: TRTYR  # 客户端所属的域为“TRTYR”

        sname  # 服务名称字段，表示请求的服务
            name-type: kRB5-NT-PRINCIPAL (2)  # 服务名称类型为Kerberos服务实例类型（kRB5-NT-SRV-INST）
            sname-string: 2 items  # 服务名称包含2个条目
                SNameString: krbtgt
                SNameString: TRTYR  # 域名为“TRTYR”

        till: Sep 13, 2037 10:48:05.000000000 中国标准时间  # 票据有效期，直到2037年9月13日10:48:05
        rtime: Sep 13, 2037 10:48:05.000000000 中国标准时间  # 票据最大返回时间，通常和有效期相同
        nonce: 1153669404  # 随机数，用于防止重放攻击

        etype: 6 items  # 支持的加密算法类型
            ENCTYPE: eTYPE-AES256-CTS-HMAC-SHA1-96 (18)  # AES256加密类型
            ENCTYPE: eTYPE-AES128-CTS-HMAC-SHA1-96 (17)  # AES128加密类型
            ENCTYPE: eTYPE-ARCFOUR-HMAC-MD5 (23)  # ARCFOUR-HMAC-MD5加密类型
            ENCTYPE: eTYPE-ARCFOUR-HMAC-MD5-56 (24)  # ARCFOUR-HMAC-MD5-56加密类型
            ENCTYPE: eTYPE-ARCFOUR-HMAC-OLD-EXP (-135)  # 旧版ARCFOUR-HMAC加密类型
            ENCTYPE: eTYPE-DES-CBC-MD5 (3)  # DES-CBC-MD5加密类型

        addresses: 1 item WIN10<20>  # 客户端地址信息
            HostAddress WIN10<20>  # 地址为WIN10
                addr-type: nETBIOS (20)  # 地址类型为NetBIOS地址
                NetBIOS Name: WIN10<20> (Server service)  # NetBIOS名称为“WIN10”

```

这里主要注意第一项 `PA-DATA pA-ENC-TIMESTAMP` 字段。它是预认证，使用用户 Hash 加密时间戳，作为 `Value` 发送给 `KDC` 的 `AS` 服务。`KDC` 从活动目录查询出用户的 `hash`，使用用户 `Hash` 解密时间戳，若能解密且时间戳在范围内，则认证通过。这也是导致哈希传递攻击（PTH）的原因。

我们看看 `impacket` 里的代码

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/003%20Kerberos认证流程-4.webp)

完整代码如下

```python
if isinstance(nthash, bytes) and nthash != b'':
    key = Key(cipher.enctype, nthash)
elif aesKey != b'':
    key = Key(cipher.enctype, aesKey)
else:
    key = cipher.string_to_key(password, encryptionTypesData[enctype], None)

if preAuth is True:
    if enctype in encryptionTypesData is False:
        raise Exception('No Encryption Data Available!')

    # Let's build the timestamp
    timeStamp = PA_ENC_TS_ENC()

    now = datetime.datetime.utcnow()
    timeStamp['patimestamp'] = KerberosTime.to_asn1(now)
    timeStamp['pausec'] = now.microsecond

    # Encrypt the shyte
    encodedTimeStamp = encoder.encode(timeStamp)

	# Key Usage 1
	# AS-REQ PA-ENC-TIMESTAMP padata timestamp, encrypted with the
	# client key (Section 5.2.7.2)
	encriptedTimeStamp = cipher.encrypt(key, 1, encodedTimeStamp, None)

	encryptedData = EncryptedData()
	encryptedData['etype'] = cipher.enctype
	encryptedData['cipher'] = encriptedTimeStamp
	encodedEncryptedData = encoder.encode(encryptedData)
```

可以看到 `encriptedTimeStamp` 的生成过程里有 `key` 参数，而 `key` 参数的生成需要使用 `用户的密码 Hash` 或 `用户的密码 AES Key` 来加密时间戳。

对其使用用户 Hash 进行解密得到

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/003%20Kerberos认证流程-8.webp)

### AS-REP 分析

当`KDC`的`AS`认证服务接收到客户端发来的`AS-REQ`请求后，从活动目录数据库中取出该用户的密钥，然后用该密钥对请求包中的`Authenticator`预认证部分进行解密，如果解密成功，并且时间戳在有效的范围内，则证明请求者提供的用户密钥正确。

`KDC` 的 `AS` 认证服务在成功认证客户端的身份之后，发送 `AS-REP` 响应包给客户端。

流量如下

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/003%20Kerberos认证流程-5.webp)

流量信息如下

```
as-rep
    pvno: 5  # Kerberos协议版本号为5
    msg-type: krb-as-rep (11)  # 消息类型为认证服务响应（AS-REP），类型编号为11

    crealm: TRTYR.TOP  # 客户端所属域为“TRTYR.TOP”

    cname  # 客户端名称字段
        name-type: kRB5-NT-PRINCIPAL (1)  # 客户端名称类型为Kerberos主名称类型（kRB5-NT-PRINCIPAL）
        cname-string: 1 item  # 客户端名称字符串，包含1个条目
            CNameString: trtyr  # 请求的用户名为“trtyr”

    ticket  # Kerberos票据部分
        tkt-vno: 5  # 票据版本号为5
        realm: TRTYR.TOP  # 票据所属域为“TRTYR.TOP”
        sname  # 服务名称字段，表示请求的服务
            name-type: kRB5-NT-SRV-INST (2)  # 服务名称类型为Kerberos服务实例类型（kRB5-NT-SRV-INST）
            sname-string: 2 items  # 服务名称包含2个条目
                SNameString: krbtgt
                SNameString: TRTYR.TOP  # 域为“TRTYR.TOP”

        enc-part  # 加密部分，用于保护票据信息
            etype: eTYPE-AES256-CTS-HMAC-SHA1-96 (18)  # 加密算法类型为AES256-CTS-HMAC-SHA1-96，编号为18
            kvno: 2  # 密钥版本号为2
            cipher […]: 7d888b98721d38e9d5bc99645cc1decfd11d36509b0d45e19c5fba19f2ffa434dc33919fe42abc677ad1e05090189337f12e7204b8f7aa21b1fd05680cff96a202642f5cf0100d444df1df540c70c6c52b72efd84723b9d51dabaf39b624dca1b8b61065817106bf1c4260b6663608fc8
                # 这是加密的票据信息，使用AES256加密算法进行加密，包含服务票据的所有必要数据

    enc-part  # 外层加密数据，也叫做Logon Session Key
        etype: eTYPE-ARCFOUR-HMAC-MD5 (23)  # 加密算法类型为ARCFOUR-HMAC-MD5，编号为23
        kvno: 1  # 密钥版本号为1
        cipher […]: ebce8dd150e04fa5ef2ab02bed96c11d0e4f4eba574d59207d7d052b6768764bf3b4cf93bd54134a3985892df8cc1b21fee329f9670587c88796a8f05eca0ca97ad09df495d968c01ddc29b475894ba913d8a66392386822a258c0192b666899fd76e7d2079fae91bf267b547c3190b50
                # 这是外层加密的票据信息，使用ARCFOUR-HMAC-MD5加密算法进行加密，包含附加的票据信息

```

`AS-REP` 返回包中最重要的就是 `TGT` 认购权证和加密的 `Logon Session Key` 了。TGT认购权证中加密部分是使用 `krbtgt` 密钥加密的，而 `Logon Session Key` 是使用请求的用户密钥加密的。

#### TGT

解密流量得到

```
ticket  # Kerberos票据部分
    tkt-vno: 5  # 票据版本号为5
    realm: TRTYR.TOP  # 票据所属域为“TRTYR.TOP”

    sname  # 服务名称部分，表示请求的服务
        name-type: kRB5-NT-SRV-INST (2)  # 服务名称类型为Kerberos服务实例类型（kRB5-NT-SRV-INST）
        sname-string: 2 items  # 服务名称包含2个条目
            SNameString: krbtgt
            SNameString: TRTYR.TOP  # 服务所在域为“TRTYR.TOP”

    enc-part  # 加密部分，包含票据信息的加密内容
        etype: eTYPE-AES256-CTS-HMAC-SHA1-96 (18)  # 加密算法类型为AES256-CTS-HMAC-SHA1-96，编号为18
        kvno: 2  # 密钥版本号为2
        cipher […]: 7d888b98721d38e9d5bc99645cc1decfd11d36509b0d45e19c5fba19f2ffa434dc33919fe42abc677ad1e05090189337f12e7204b8f7aa21b1fd05680cff96a202642f5cf0100d444df1df540c70c6c52b72efd84723b9d51dabaf39b624dca1b8b61065817106bf1c4260b6663608fc8
            # 这是加密的票据信息，使用AES256加密算法进行加密，包含服务票据的所有必要数据

            Decrypted keytype 18 usage 2 using keytab principal krbtgt@TESTSEGMENT.LOCAL (id=keytab.2 same=0) (b4e4fe7a...)
                # 解密使用了密钥表中的密钥，该密钥类型为18，使用的主密钥为krbtgt@TESTSEGMENT.LOCAL

        encTicketPart  # 票据部分的加密数据
            Padding: 0  # 没有填充数据
            flags: 40e10000  # 票据标志位
                0... .... = reserved: False  # 未使用的标志位
                .1.. .... = forwardable: True  # 票据是可转发的
                ..0. .... = forwarded: False  # 票据没有被转发
                ...0 .... = proxiable: False  # 票据不可代理
                .... 0... = proxy: False  # 票据不是代理
                .... .0.. = may-postdate: False  # 不允许延迟使用
                .... ..0. = postdated: False  # 票据不是后日期票据
                .... ...0 = invalid: False  # 票据有效
                1... .... = renewable: True  # 票据可以续期
                .1.. .... = initial: True  # 票据为初始票据
                ..1. .... = pre-authent: True  # 票据需要预认证
                ...0 .... = hw-authent: False  # 票据没有硬件认证
                .... 0... = transited-policy-checked: False  # 未检查中转策略
                .... .0.. = ok-as-delegate: False  # 不允许作为委托使用
                .... ..0. = unused: False  # 未使用的标志位
                .... ...1 = enc-pa-rep: True  # 已加密PA-REP（票据授予请求）响应
                0... .... = anonymous: False  # 票据不是匿名的

            key  # 密钥部分
                Learnt encTicketPart_key keytype 18 (id=29.1) (21d49e0b...)
                    # 这是通过密钥表获得的加密票据部分的密钥，密钥类型为18，标识符为29.1
                keytype: 18  # 密钥类型为18（AES256）
                keyvalue: 21d49e0bc6bf662e35cae82a9a10ed558c057ac09f0d224386fdb7eee40b09d7  # 密钥值

        crealm: TRTYR.TOP  # 客户端所属的域为“TRTYR.TOP”

        cname  # 客户端名称字段
            name-type: kRB5-NT-PRINCIPAL (1)  # 客户端名称类型为Kerberos主名称类型（kRB5-NT-PRINCIPAL）
            cname-string: 1 item  # 客户端名称包含1个条目
                CNameString: trtyr  # 请求的用户名为“trtyr”

        transited  # 转发信息（如果存在）
            tr-type: 0  # 转发类型为0
            contents: <MISSING>  # 内容缺失，未显示任何转发数据

        authtime: Jan  9, 2025 12:16:35.000000000 中国标准时间  # 认证时间
        starttime: Jan  9, 2025 12:16:35.000000000 中国标准时间  # 票据生效时间
        endtime: Jan  9, 2025 22:16:35.000000000 中国标准时间  # 票据过期时间
        renew-till: Jan 16, 2025 12:16:35.000000000 中国标准时间  # 票据续期时间

        authorization-data: 1 item  # 授权数据包含1项
```

其中的 `authorization-data` 就是 `PAC` 了，主要是靠 `PAC_LOGON_INFO` 里的 `User RID` 和 `Group RID` 来区分权限

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/003%20Kerberos认证流程-6.webp)

`KDC` 生成 `PAC` 的过程如下：KDC在收到客户端发来的 `AS-REQ` 请求后，从请求中取出 `cname` 字段，然后查询活动目录数据库，找到 `sAMAccountName` 属性为 `cname` 字段的值的用户，用该用户的身份生成一个对应的 `PAC`。

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/003%20Kerberos认证流程-7.webp)

#### Logon Session Key

`AS-REP` 响应包最外层的那部分便是加密的 `Login session Key` 了，其作用是用于确保客户端和 `KDC` 下阶段之间通信安全，它使用请求的用户密钥加密。得到如下流量内容

```
enc-part
    etype: eTYPE-ARCFOUR-HMAC-MD5 (23)
        # 使用 ARCFOUR-HMAC-MD5 加密类型，表示加密的数据使用了这种加密算法。
    kvno: 1
        # 密钥版本号 (Key Version Number)，指示所使用的密钥的版本。
    cipher […]: ebce8dd150e04fa5ef2ab02bed96c11d...
        # 加密的数据部分，这是 KDC 返回给客户端的重要信息。

        Decrypted keytype 23 usage 3 using keytab principal krbtgt@TESTSEGMENT.LOCAL (id=keytab.4 same=0) (329153f5...)
            # 数据解密后，表明使用了 Keytab 文件中标识为 keytab.4 的密钥。
            [Expert Info]: Used keymap=all_keys num_keys=10 num_tries=2
                # 解密尝试了 2 次，密钥总数为 10。

        encASRepPart
            key
                Learnt encASRepPart_key keytype 18 (id=29.2) (21d49e0b...)
                    # 解密后获得会话密钥，类型为 AES256-CTS-HMAC-SHA1-96。
                keytype: 18
                    # 加密类型 AES256-CTS-HMAC-SHA1-96。
                keyvalue: 21d49e0bc6bf662e35cae82a9a10ed558c057ac09f0d224386fdb7eee40b09d7
                    # 会话密钥的具体值。

            last-req: 1 item
                LastReq item
                    lr-type: lR-NONE (0)
                        # 指定请求类型为 lR-NONE，表示没有特殊的最后请求。
                    lr-value: Jan  9, 2025 12:16:35.000000000 中国标准时间
                        # 最后请求的时间。

            nonce: 1153669404
                # 客户端在请求中发送的随机数，用于防止重放攻击。
            key-expiration: Feb  7, 2025 08:14:34.000000000 中国标准时间
                # 会话密钥的有效截止日期。
            Padding: 0
                # 填充数据，确保数据长度符合加密算法的要求。
            flags: 40e10000
                # 标志字段，表示票证的属性：
                    # forwardable: True - 票证可以被转发。
                    # renewable: True - 票证可续订。
                    # initial: True - 这是初始票证。
                    # pre-authent: True - 票证已通过预认证。
                    # enc-pa-rep: True - 票证包含加密的 PA 数据。
            authtime: Jan  9, 2025 12:16:35.000000000 中国标准时间
                # 票证的认证时间。
            starttime: Jan  9, 2025 12:16:35.000000000 中国标准时间
                # 票证的有效开始时间。
            endtime: Jan  9, 2025 22:16:35.000000000 中国标准时间
                # 票证的过期时间。
            renew-till: Jan 16, 2025 12:16:35.000000000 中国标准时间
                # 票证的可续订截止时间。

            srealm: TRTYR.TOP
                # 服务所在的域。
            sname
                name-type: kRB5-NT-SRV-INST (2)
                    # 服务名称的类型为 KRB5-NT-SRV-INST，表示服务实例。
                sname-string: 2 items
                    SNameString: krbtgt
                    SNameString: TRTYR.TOP
                        # 服务所在域为 TRTYR.TOP。

            caddr: 1 item WIN10<20>
                HostAddress WIN10<20>
                    addr-type: nETBIOS (20)
                        # 地址类型为 NetBIOS。
                    NetBIOS Name: WIN10<20> (Server service)
                        # 客户端的 NetBIOS 名称为 WIN10<20>。

            encrypted-pa-data: 1 item
                PA-DATA pA-SUPPORTED-ETYPES
                    padata-type: pA-SUPPORTED-ETYPES (165)
                        # 指定支持的加密类型。
                    padata-value: 1f000000
                        SupportedEnctypes: 0x0000001f
                            # 客户端支持的加密算法，包括：
                            # des-cbc-crc, des-cbc-md5, rc4-hmac, aes128-cts-hmac-sha1-96, aes256-cts-hmac-sha1-96。
```

代码如下

```python
# Key Usage 3
# AS-REP encrypted part (includes TGS session key or
# application session key), encrypted with the client key
# (Section 5.4.2)
try:
    plainText = cipher.decrypt(key, 3, cipherText)
except InvalidChecksum as e:
    # probably bad password if preauth is disabled
    if preAuth is False:
        error_msg = "failed to decrypt session key: %s" % str(e)
        raise SessionKeyDecryptionError(error_msg, asRep, cipher, key, cipherText)
    raise
encASRepPart = decoder.decode(plainText, asn1Spec = EncASRepPart())[0]

# Get the session key and the ticket
cipher = _enctype_table[encASRepPart['key']['keytype']]
sessionKey = Key(cipher.enctype,encASRepPart['key']['keyvalue'].asOctets())
```

可以看到这个生成过程里的 `plainText` 是需要 `key` 的参与，而这个 `key` 就是我们上面生成加密时间戳时用到的那个 `key`

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/003%20Kerberos认证流程-11.webp)

## TGS

 客户端再收到 `KDC` 的 `AS-REP` 回复后，使用用户密钥解密加密过的 `Logon Session Key`，得到 `Logon Session Key`，并且也拿到了TGT认购权证。之后它会在本地缓存此 `TGT` 认购权证和 ` Logon Session Key`。现在客户端需要凭借这张 `TGT` 认购凭证向 `KDC` 购买相应的 `ST` 服务票据。

### TGS-REQ 分析

客户端拿着上一步获得的`TGT`认购权证发起`TGS-REQ`请求，向`KDC`购买针对指定服务的`ST`服务票据

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/003%20Kerberos认证流程-9.webp)

得到流量信息如下

```
tgs-req
    pvno: 5   # 协议版本号，Kerberos 5
    msg-type: krb-tgs-req (12)  # 消息类型，表示这是一个TGS请求（Ticket Granting Service Request）
    padata: 2 items  # 预认证数据（Pre-authentication Data），包含2项内容
        PA-DATA pA-TGS-REQ
            padata-type: pA-TGS-REQ (1)  # PA类型，表示TGS请求
                padata-value […]: 6e8204af...  # 包含TGS请求的具体值
                    ap-req  # 应用程序请求部分
                        pvno: 5   # 协议版本号
                        msg-type: krb-ap-req (14)  # 消息类型，表示这是一个AP请求（Application Request）
                        Padding: 0  # 填充字节
                        ap-options: 00000000  # AP选项，没有启用任何标志位
                            0... .... = reserved: False  # 保留位，未使用
                            .0.. .... = use-session-key: False  # 未请求使用会话密钥
                            ..0. .... = mutual-required: False  # 未请求双向认证
                        ticket  # 包含服务票据
                            tkt-vno: 5  # 票据版本号
                            realm: TRTYR.TOP  # 目标域名称
                            sname  # 服务名称
                                name-type: kRB5-NT-SRV-INST (2)  # 名称类型，表示服务实例
                                sname-string: 2 items
                                    SNameString: krbtgt
                                    SNameString: TRTYR.TOP  # 服务所属域
                            enc-part  # 加密部分，包含服务票据的敏感信息
                                etype: eTYPE-AES256-CTS-HMAC-SHA1-96 (18)  # 加密类型，使用AES-256-CTS
                                kvno: 2  # 密钥版本号
                                cipher […]: 7d888b98...  # 加密数据
                                    Decrypted keytype 18 usage 2 using keytab principal krbtgt@TESTSEGMENT.LOCAL  # 使用Keytab解密成功
                                        [Expert Info (Chat/Security): Decrypted keytype 18 usage 2 using keytab principal...]  # 解密信息
                                    encTicketPart  # 解密后的票据部分
                                        Padding: 0  # 填充字节
                                        flags: 40e10000  # 票据标志
                                        key  # 用于加密的密钥
                                            Learnt encTicketPart_key keytype 18 (id=37.1) (21d49e0b...)  # 学到的加密密钥
                                                keytype: 18  # 密钥类型
                                                keyvalue: 21d49e0b...  # 密钥值
                                        crealm: TRTYR.TOP  # 客户端所在域
                                        cname  # 客户端名称
                                            name-type: kRB5-NT-PRINCIPAL (1)  # 名称类型，主名称
                                            cname-string: 1 item
                                                CNameString: trtyr  # 请求用户名
                                        transited  # 中继信息
                                        authtime: Jan  9, 2025 12:16:35.000000000 中国标准时间  # 身份验证时间
                                        starttime: Jan  9, 2025 12:16:35.000000000 中国标准时间  # 生效时间
                                        endtime: Jan  9, 2025 22:16:35.000000000 中国标准时间  # 失效时间
                                        renew-till: Jan 16, 2025 12:16:35.000000000 中国标准时间  # 可续订至时间
                                        authorization-data: 1 item  # 授权数据部分
                        authenticator  # 验证器部分，用于验证请求的真实性
        PA-DATA pA-PAC-OPTIONS
    req-body  # 请求主体
        Padding: 0  # 填充字节
        kdc-options: 40810000  # KDC选项
        realm: TRTYR.TOP  # 目标域
        sname  # 请求的服务名称
            name-type: kRB5-NT-SRV-INST (2)  # 名称类型，服务实例
            sname-string: 2 items
                SNameString: cifs  # CIFS协议服务
                SNameString: WIN7  # 目标主机名称
        till: Sep 13, 2037 10:48:05.000000000 中国标准时间  # 请求的票据有效期
        nonce: 1153669407  # 随机数，用于防止重放攻击
        etype: 5 items  # 支持的加密类型列表
        enc-authorization-data  # 加密的授权数据部分

```

为了确保后阶段的会话安全，`TGS-REQ` 中 `ap-req` 中的 `authenticator` 字段的值是用上一步 `AS-REP` 中返回的 `Logon Session Key` 加密的时间戳

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/003%20Kerberos认证流程-10.webp)

看一下代码

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/003%20Kerberos认证流程-12.webp)

得到代码

```python
encodedAuthenticator = encoder.encode(authenticator)

# Key Usage 7
# TGS-REQ PA-TGS-REQ padata AP-REQ Authenticator (includes
# TGS authenticator subkey), encrypted with the TGS session
# key (Section 5.5.1)
encryptedEncodedAuthenticator = cipher.encrypt(sessionKey, 7, encodedAuthenticator, None)

apReq['authenticator'] = noValue
apReq['authenticator']['etype'] = cipher.enctype
apReq['authenticator']['cipher'] = encryptedEncodedAuthenticator
```

这个 `authenticator` 就是 `encryptedEncodedAuthenticator`，而 `encryptedEncodedAuthenticator` 的生成需要 `sessionKey`。

### TGS-REP 分析

`KDC` 的 `TGS` 服务接收到 `TGS-REQ` 请求之后，首先使用 `krbtgt` 密钥解密 `TGT` 认购权证中加密部分得到 `Logon Session key` 和 `PAC` 等信息，如果能解密成功则说明该 `TGT` 认购权证是 `KDC` 颁发的。然后验证 `PAC` 的签名，如果签名正确，则证明 `PAC` 未经过篡改。然后使用 `Logon Session Key` 解密 `Authenticator` 得到时间戳等信息，如果能够解密成功，并且票据时间在范围内，则验证了会话的安全性。

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/003%20Kerberos认证流程-13.webp)

在完成上述的检测后，`KDC` 的 `TGS` 服务完成了对客户端的认证，`TGS` 服务发送响应包给客户端。

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/003%20Kerberos认证流程-14.webp)

流量内容如下

```
tgs-rep
    pvno: 5
    msg-type: krb-tgs-rep (13)  // 消息类型，表示 TGS 响应消息
    crealm: TRTYR.TOP  // 客户端的域名
    cname
        name-type: kRB5-NT-PRINCIPAL (1)  // 名称类型为主体（Principal）
        cname-string: 1 item
            CNameString: trtyr  // 请求的用户名
    ticket
        tkt-vno: 5  // 票据版本号
        realm: TRTYR.TOP  // 服务的域名
        sname
            name-type: kRB5-NT-SRV-INST (2)  // 名称类型为服务实例
            sname-string: 2 items
                SNameString: cifs  // 服务名称
                SNameString: WIN7  // 服务实例名称
        enc-part
            etype: eTYPE-AES256-CTS-HMAC-SHA1-96 (18)  // 加密类型：AES256-CTS-HMAC-SHA1-96
            kvno: 1  // 密钥版本号
            cipher […]: 3531f1cbebb1e71e897658b244221b32bb2bde8b9b31827db7b29a8f1124e8a7a06962ceaf7620bf726590785454044ddbc8a10ff072da2fe50bc20274076181ad968a5f22c3e2ac0e320acec4ad5ba784efa1ecd564131fc71fa6a78329e0e2d7271d740ede18cb26427611aab3f01bb
                // 加密后的票据部分，使用 AES256 加密算法，密钥版本号为 1
    enc-part
        etype: eTYPE-AES256-CTS-HMAC-SHA1-96 (18)  // 再次使用 AES256-CTS-HMAC-SHA1-96 加密算法
        cipher […]: 33ff563e2e8d530bb16ef2ef6c641ac9a40fa607712c3010705f88ddfc4f638b2cf5584b258691ee50cdedcb343aa70c3a3ef250744f6110c294afb8df9acaeef16115e26f44347370c161a04ac9ad645f9e6c654fb86bb270872df8d859f661d1a2a92636b45ca5f68948dc78c41a2f6
                // 另一部分加密数据，使用相同的加密算法

```

`TGS-REP`返回包中最重要的就是 `ST` 服务票据和 `Service Session key` 了。`ST` 服务票据中加密部分是使用服务密钥加密的，而 `Service Session key` 是使用 `Logon Session Key` 加密的。

#### ST

`TGS-REP` 响应包中的 `ticket` 便是 `ST` 服务票据了。流量如下

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/003%20Kerberos认证流程-15.webp)

看一下 `PAC` 的 `User RID` 和 `Group RID`

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/003%20Kerberos认证流程-16.webp)

可以发现，和 `TGT` 过程中的一样。在正常的 `TGS` 过程，`KDC` 在 `ST` 中的 `PAC` 是直接拷贝 `TGT` 的 `PAC`

#### Service Session Key

在外层的 `enc-part` 就是 `Service Session Key` 了，使用 `Logon Session Key` 加密

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/003%20Kerberos认证流程-18.webp)

这里的 `keyvalue` 在 `ST` 票据里也有

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/003%20Kerberos认证流程-19.webp)

## AP

客户端在收到 `KDC` 返回的 `TGS-REP` 消息，从中取出 `ST` 服务票据后，就准备要开始申请访问服务了。

由于我们是用 `SMB` 进行连接的，所以之后的内容都是在 `SMB` 里

### AP-REQ 分析

客户端接收到 `KDC` 的 `TGS` 回复后，通过缓存的 `Logon Session Key` 解密 `enc_Service Session key` 得到 `Service Session Key`，同时它也拿到了 `ST` 服务票据。`Serivce Session Key` 和 `ST` 服务票据会被客户端缓存。

我们查看流量

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/003%20Kerberos认证流程-20.webp)

内容如下

```
ap-req
    pvno: 5
    msg-type: krb-ap-req (14)
    Padding: 0
    ap-options: 20000000
    ticket
        tkt-vno: 5
        realm: TRTYR.TOP
        sname
        enc-part
            etype: eTYPE-AES256-CTS-HMAC-SHA1-96 (18)
            kvno: 1
            cipher […]: 3531f1cbebb1e71e897658b244221b32bb2bde8b9b31827db7b29a8f1124e8a7a06962ceaf7620bf726590785454044ddbc8a10ff072da2fe50bc20274076181ad968a5f22c3e2ac0e320acec4ad5ba784efa1ecd564131fc71fa6a78329e0e2d7271d740ede18cb26427611aab3f01bb
                Decrypted keytype 18 usage 2 using keytab principal WIN7$@trtyr.top (id=keytab.16 same=0) (4b634683...)
                encTicketPart
                    Padding: 0
                    flags: 40a10000
                    key
                        Learnt encTicketPart_key keytype 18 (id=44.1) (a7ac1896...)
                        keytype: 18
                        keyvalue: a7ac1896dff6faab4d0b933db7fa1614375ce7628b8887f29800bee2e694fc5d
                    crealm: TRTYR.TOP
                    cname
                    transited
                    authtime: Jan  9, 2025 12:16:35.000000000 中国标准时间
                    starttime: Jan  9, 2025 12:16:35.000000000 中国标准时间
                    endtime: Jan  9, 2025 22:16:35.000000000 中国标准时间
                    renew-till: Jan 16, 2025 12:16:35.000000000 中国标准时间
                    authorization-data: 2 items
    authenticator: Service Session Key 加密过的时间戳
```

可以看到，这里的 `keyvalue` 就是之前的 `ST` ，客户端拿着 `ST` 去请求服务。`authenticator` 下面是这样的

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/003%20Kerberos认证流程-22.webp)

### AP-REP 分析

这一步是可选的，当客户端希望验证提供服务的服务端时（也就是 `AP-REQ` 请求中 `mutual-required` 协商选项为 `True`），服务端返回 `AP-REP` 消息。

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/003%20Kerberos认证流程-21.webp)

服务端收到客户端发来的 `AP-REQ` 消息后，通过服务密钥解密 `ST` 服务票据得到 `Service Session Key` 和 `PAC` 等信息，然后用 `Service Session Key` 解密 `Authenticator` 得到时间戳。如果能解密成功且时间戳在有效范围内，则验证了客户端的身份。

验证了客户端身份后，服务端从 `ST` 服务票据中取出 `PAC` 中代表用户身份权限信息的数据，然后与请求的服务 `ACL` 做对比，生成相应的访问令牌。

同时，服务端会检查`AP-REQ`请求中`mutual-required`协商选项是否为`True`，如果为`True`的话，说明客户端想验证服务端的身份。此时，服务端会用`Service Session Key`加密时间戳作为`Authenticator`，在`AP-REP`响应包中发送给客户端进行验证。

![](https://img.trtyr.top/images/blog/Kerberos%E5%8D%8F%E8%AE%AE%E8%AF%A6%E8%A7%A3/003%20Kerberos认证流程-23.webp)

如果 `mutual-required` 选项为 `False` 的话，服务端会根据访问令牌的权限决定是否返回相应的服务给客户端。
