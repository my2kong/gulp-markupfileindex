var markupfileindex = require('../index');

var gulp = require('gulp');
//var fs = require('fs');


gulp.task('default', function() {
    markupfileindex({
        title : '서정타이틀',
        filename : 'index.html',
        src_dir : 'fixture/',
        dest_dir : 'dist/'
    });
});
