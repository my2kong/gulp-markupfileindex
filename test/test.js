var markupfileindex = require('../index');
var fs = require('fs');

describe('gulp-minify-html', function() {
    it('test case1', function() {
        markupfileindex({
            title : '서정타이틀',
            filename : '@index.html',
            src_dir : 'fixture/',
            dest_dir : 'fixture/'
        });
    });
});