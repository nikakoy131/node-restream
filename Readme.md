Node-Restream - WARNING!!! This just education project (not for production purpose)
===================


----------


**What is this?**
 This free [Node.js](https://github.com/nodejs/node "Node.js") + [FFmpeg](https://github.com/FFmpeg/FFmpeg) + [nginx-rtmp-module](https://github.com/arut/nginx-rtmp-module) based restream app (like restream.io). 
 


----------


 **Use case?**
 You have bradcasting sofware (Vmix, Wirecast, Xsplit, FLME, OBS, ffmpeg) and you want without re-encoding publish your video to multiply streaming platform (Youtube Live, Twich, Facebook Live, custom rtmp server and etc.). You can do it by buying wowza, wowzacloud or use premium version of restream.io. At now, You can make your own restream platform from free components.
 


----------
**Installing components**
In case you have debian based OS just type in treminal.

    sudo apt-get update && sudo apt install -y nodejs ffmpeg

For install nginx you need compile it from source. For the instruction go to [nginx-rtmp-module](https://github.com/arut/nginx-rtmp-module) page.


----------
**TODO list**

 1. Just input on webpage for place rtmp stream +
 2. Button for get info about stream in human readable format +
 3. Button for restream start \ stop. +
 4. When streaming active show status (long poling?)
 5. Show information about input stream status, restarts counter.
 6. Hls stream player.
 7. Play button on added stream
 8. Recording button.
 9. Mongo db save streams
 10. Authorization for one user \ for others - please login\ first user - admin