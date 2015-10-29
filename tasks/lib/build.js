var relativeImports = /import\s({[0-9a-zA-Z\,\s]+}|\*\sas\s[0-9a-zA-Z_]+)\s*from\s['"]\..*;/g;
var nonRelativeImports = /import\s*{?[0-9a-zA-Z\*\,\s]+}?\s*from\s*'[0-9a-zA-Z\-]+';\s*/g;
var importGrouper = /import\s*{([0-9a-zA-Z\,\s]+)}\s*from\s*'([0-9a-zA-Z\-]+)'\s*;\s*/;

exports.extractImports = function(content, importsToAdd){
  var matchesToKeep = content.match(nonRelativeImports);
  importsToAdd = importsToAdd || [];

  if(matchesToKeep){
    matchesToKeep.forEach(function(toKeep){ importsToAdd.push(toKeep) });
  }

  content = content.replace(nonRelativeImports, '');
  content = content.replace(relativeImports, '');

  return content;
};

exports.createImportBlock = function(importsToAdd){
  var finalImports = {}, importBlock = '';

  importsToAdd.forEach(function(toAdd){
    var groups = importGrouper.exec(toAdd);
    if(!groups) {
      toAdd = toAdd.trim();
      if(importBlock.indexOf(toAdd) === -1){
        importBlock += toAdd + '\n';
      }

      return;
    };

    var theImports = groups[1].split(',');
    var theSource = groups[2].trim();
    var theList = finalImports[theSource] || (finalImports[theSource] = []);

    theImports.forEach(function(item){
      item = item.trim();
      if(theList.indexOf(item) === -1){
        theList.push(item);
      }
    });
  });

  Object.keys(finalImports).forEach(function(key) {
    importBlock += '  import { ' + finalImports[key].join(', ') + ' } from \'' + key + '\';\n';
  });

  return importBlock + '\n';
};
