module.exports.ensureArray = function ensureArray( item )
{
  return ( item instanceof Array ) ? item : [ item ];
}
