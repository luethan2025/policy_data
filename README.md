# Google Play Developer Privacy Policy Dataset
This command-line tool curates URLs of privacy policies from Google Play developers. The curatored URLs are obtained using the native clustering of Andriod Apps on Google Play. You can build your dataset by prompting several unrelated Andriod Apps.

## Getting Started
To use this tool, you will need [Node.js](https://nodejs.org/en), which you should install on your machine beforehand. <br>

Clone this repository to your machine:
```shell
> git clone https://github.com/luethan2025/policy_data.git
```
Now install the project's dependencies and configure Puppeteer by 'cd'-ing into the root of this project and running the command:
```shell
> sh bin/scripts/setup.sh
```

# Usage
Once all dependencies have been installed and Puppeteer has been properly configured, you can now use create your dataset.
```
Usage: scraper [options]

Google Play developer privacy policy dataset

Options:
  -V, --version         output the version number
  --append <boolean>    append to destination file (default: false)
  --url <string>        URL to Google Play Android app
  --depth <number>      maximum progession (default: 10)
  --directory <string>  destination directory (default: "./data/")
  --filename <string>   destination file (default: "policy.txt")
  -h, --help            display help for command
```
At minimum you must at least set the url argument to successfully run the program. The dataset will be found in ./data/ by default, however, if you set the directory or the filename argument the dataset will be found there instead.

# Technologies
Pixiv Data is built using [Node.js](https://nodejs.org/en) and the [Puppeteer API](https://github.com/puppeteer/puppeteer).

# Additional Notes
Android apps must the 'Data Safety' section in order for their privacy policy to be successfully collected:
<p align="center">
<img src = docs/images/data_safety.png>
</p>
