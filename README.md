# host-resolver-client

用于生成 hosts 文件，分为客户端和服务端。服务端地址 [host-resolver-server](https://github.com/crysehillmes/host-resolver-server)

安装 
```bash
npm install -g host-resolver-client
```

使用, 需要管理员或者 sudo :
```
resolve-hosts
-c, --config [config]        Config file path. Default is ~[/host-resolver-config.json]
-H, --hostsfile [hostsfile]  Output hosts file. On Windows, default is [%SYSTEMROOT%\system32\drivers\etc\hosts]. On *nix and OS X, default is [/etc/hosts]
```

范例 config.json

```
{
    "hostsfile": "C:\\Windows\\System32\\drivers\\etc\\hosts",
    "server_host": "",
    "server_port": "",
    "server_auth_token": "",
    "host_templates": [
        "hosts.template"
    ],
    "host_list": [
    ]
}

```