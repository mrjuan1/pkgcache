# pkgcache

## Requirements

Install any recent version of NodeJS that supports ES6.

For development (eslint), you can also run:

```bash
npm i --only=dev
```

## Setup

Edit `config.json` to suit your needs. An example file is included for reference.

Here's a list of fields and what they mean:

* `cacheDir` - Required. The directory all cached files will be stored in. This directory does not need to exist, it will be created automatically when required. This path can also either be an absolute or a relative path.

* `distTimeout` - Required. This is the timeout (in minutes) of all repo "dist" files. These basically include package indices or any other files you'd like to not be permanently persistant. There will be more info on how to specify these files below...

* `repos` - Required. This contains configurations for each repository you want to cache. Each entry will be identified by the first path in the URL (eg. `"debian"` could be used when accessed via `"http://localhost:3000/debian/..."`).

* `"repo name": mirror` - Required. This is the source repository's full location. Only http is supported and the URL must **NOT** end with a trailing `"/"`. See the examples in the included example reference `config.json` file.

* `"repo name": dists` - Optional. This is an array of strings, each representing a regular expression to use when checking for "dist" files (see `distTimeout` above). Note that any `"\"`'s need to be escaped, otherwise they will be ignored or could cause errors. See the the example reference config file.

Once the `config.json` file has been set up, you can configure the location or name of the config file by editing the `CONFIG_PATH` constant in the `config.js` file.

You can also configure the port on which `pkgcache` runs by editing the `PORT` constant in the `server.js` file.

## Running

Once everything is set up and configured to your preference, you can run the software by simply running:

```bash
node
```

...from the `pkgcache` directory. If you wish to configure `pkgcache` as a systemd service on Linux, you could do the following, for example:

```bash
sed -i 's|^const PORT = .*$|const PORT = 7542|' pkgcache/server.js # Or which ever port you wish to use...

sed -i "s|^const CONFIG_PATH = .*$|const CONFIG_PATH = '/etc/pkgcache/config.json'|" pkgcache/config.js # Or which ever location you wish to store the config file...

sudo mkdir /etc/pkgcache
sudo mv pkgcache/config.json /etc/pkgcache

sudo mv pkgcache /usr/share # Or where ever you wish to store the software...
sudo chmod +x /usr/share/pkgcache/index.js
sudo ln -s /usr/share/pkgcache/index.js /usr/bin/pkgcache

cat > pkgcache.service << "EOF"
[Unit]
Description=pkgcache

[Service]
ExecStart=/usr/bin/pkgcache

[Install]
WantedBy=multi-user.target
EOF
sudo mv pkgcache.service /etc/systemd/system
sudo systemctl enable pkgcache

sudo systemctl start pkgcache
```

## Usage

You can simply add the URL to your distribution's repository list. Here are some examples; just replace `server_ip` with the IP of the server running `pkgcache` (these assume you're running as `root`):

* Arch:

```bash
echo "Server = http://server_ip:3000/arch/\$repo/os/\$arch" > /etc/pacman.d/mirrorlist
pacman -Sy
```

* Alpine:

```bash
echo "http://server_ip:3000/alpine" > /etc/apk/repositories
apk update
```

* Debian:

```bash
cat > /etc/apt/sources.list << "EOF"
deb http://server_ip:3000/debian stable main
deb http://server_ip:3000/debian stable-updates main
deb http://server_up:3000/debian-security stable/updates main
EOF
apt update
```
