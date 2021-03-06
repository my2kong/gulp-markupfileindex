'use strict';

var isWindows = process.platform === 'win32',
    chardet = require('chardet'),
    async = require('async'),
    fs = require('fs'),
    path = require('path'),
    gulp = require('gulp-util'),
    gutil = require('gulp-util'),
    merge = require('merge'),
    _ = require('lodash');

module.exports = function(opt){
    var options = merge({
            show_date: false,
            filename: '@index.html',
            title: '마크업 산출물',
            include_folder: ['!$%^!@#$%'],
            file_sort: 'asc',
            file_sort_key: 'title',
            group_sort: 'asc',
            src_dir: '',
            dest_dir: ''
        }, opt),
        //done = this.async(),
        defaultGroupName = ['etc', 'includes'],
        outputGroupName = ['기타', 'Include Files'],
        saveFileList = [],
        checkDestFolder = options.src_dir == options.dest_dir ? true : false;

    var files = fs.readdirSync(options.src_dir);

    //this.data.src.push(this.data.dest + options.filename);
    
    
    files.forEach(function(src){
        var dest = unixifyPath(path.join(options.dest_dir, src));
            src = unixifyPath(path.join(options.src_dir, src));

        var isDir = function(filepath) {
            return fs.existsSync(filepath) && fs.statSync(filepath).isDirectory();
        };

        if(checkDestFolder){
            dest = src.replace(options.dest_dir, '');
        }else{
            dest = '../' + src;
        }

        if(isDir(src) !== true && !path.join(options.src_dir, options.filename) == src ? false : true){
            getTitle(src, dest);
        }
    });

    output();

    function unixifyPath(filepath) {
        if (isWindows) {
            return filepath.replace(/\\/g, '/');
        } else {
            return filepath;
        }
    }

    //title 값 가져오기
    function getTitle(src, dest){
        var title = '',
            fileGroup = '',
            fileContent = null,
            filename = src.split('/'),
            checkIncludeFolder = new RegExp('\/?' + (options.include_folder.toString()).replace(/,/g, '|') + '\/', 'g');

        filename = (filename.length) ? filename[filename.length-1] : filename;

        if(chardet.detectFileSync(src) === 'EUC-KR'){
            fileContent = fs.readFileSync(src, {encoding: 'euc-kr'});
        }else{
            fileContent = fs.readFileSync(src);
        }

        fileContent = fileContent.toString();

        //html 문법에서 title값 찾기

        title = fileContent.match(/<title>.*<\/title>/gi);

        if(title !== null){
            title = title[0].replace(/[<|<\/]+title>/gi,'');

            //html title 값이 php 문법일때
            if(title.match(/<\?.*\$pageTitle.*\?>/gi)) title = filename;
        }else{
            //php 문법에서 title값 찾기
            title = fileContent.match(/<\?.*\$pageTitle=[\'|\"].*[\'|\"].*\?>/gi);

            if(title !== null){
                title = title[0].replace(/<\?.*\$pageTitle=[\'|\"]|[\'|\"].*\?>/gi, '');
            }else{
                title = filename;
            }
        }

        //파일 그룹 처리
        if(filename.match(/_incl|incl_|_inc|inc_/g) !== null || src.match(checkIncludeFolder) !== null){
            fileGroup = defaultGroupName[1];
        }else if(title !== null && title.match(/\[.*\]/) !== null){
            fileGroup = (title.match(/\[.*\]/))[0].replace(/\[|\]/g,'');
            title = title.replace(/\[.*\]/,'');
        }else{
            fileGroup = defaultGroupName[0];
        }

        saveFileList.push({
            'group': fileGroup,
            'abspath': dest,
            'title': title,
            'filename': filename
        });
    }

    //인덱스 파일 생성
    function output(){
        var tpl = fs.readFileSync('../tpl/tpl.html', 'utf8'),
            destFilePath = path.join(unixifyPath(options.dest_dir), options.filename),
            date = new Date(),
            html = [],
            saveTarget = 0,
            creationDate = '',
            title = '';

        // 파일 그룹 정렬
        saveFileList = groupBy(saveFileList, 'group', options.group_sort);

        // 그룹별 출력
        for(var group in saveFileList){
            if(group === defaultGroupName[0]){
                saveTarget = 0;
                title = outputGroupName[0]
            }else if(group === defaultGroupName[1]){
                saveTarget = 0;
                title = outputGroupName[1];
            }else{
                saveTarget = 1;
                title = group;
            }

            if(!!!html[saveTarget]) html[saveTarget] = '';

            html[saveTarget] += '\r\n\t\t<h2 class="sec_h">' + title + '</h2>\r\n';

            // 파일 리스트 정렬
            saveFileList[group] = sortFileList(saveFileList[group], options.file_sort_key, options.file_sort);

            html[saveTarget] += '\t\t<ul>\r\n';

            for(var lst in saveFileList[group]){
                html[saveTarget] += '\t\t<li><a href="' + saveFileList[group][lst].abspath + '">'+ saveFileList[group][lst].title + '<span> / ' + saveFileList[group][lst].abspath + '</span></a></li>\r\n';
            }

            html[saveTarget] += '\t\t</ul>\r\n';
        }

        if(!!!html[0]) html[0] = '';
        if(!!!html[1]) html[1] = '';

        html = html[1].concat(html[0]);

        if(options.show_date){
            creationDate = '<span>(생성일 : ' + date.getFullYear() + '년 ' + parseInt(date.getMonth()+1) + '월 ' + date.getDate() + '일 ' + date.getHours() + '시 ' + date.getMinutes() + '분' +')</span>';
        }

        fs.writeFileSync(destFilePath,
            tpl.replace('[[html]]', html).replace(/\[\[title\]\]/g,
                options.title).replace('[[date]]', creationDate)
        );

        gutil.log(gutil.colors.green(destFilePath + ' 파일 인덱스 생성 완료'));

        //done();
    }

    // 그룹 정렬
    function groupBy(obj, key, orderBy) {
        var obj = _.groupBy(obj, key);

        obj = sortObjectByKey(obj, orderBy);

        return obj;
    }

    // 오브젝트 정렬
    function sortObjectByKey(obj, orderBy){
        if(orderBy === 'desc'){
            return Object.keys(obj).sort().reverse().reduce(function (result, key) {
                result[key] = obj[key];
                return result;
            }, {});
        }else{
            return Object.keys(obj).sort().reduce(function (result, key) {
                result[key] = obj[key];
                return result;
            }, {});
        }
    };

    // 그룹 > 파일 리스트 정렬
    function sortFileList(obj, key, orderBy){
        if(key !== 'title' && key !== 'filename') return obj;

        obj = obj.sort(function(a, b){
            try{
                var nameA = a[key].toLowerCase(),
                    nameB = b[key].toLowerCase();

                if(nameA < nameB) return -1;
                if(nameA > nameB) return 1;
                return 0;
            }catch(e){

            }
        });

        if(orderBy === 'desc') return obj.reverse();

        return obj;
    }
};