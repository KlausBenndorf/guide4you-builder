/**
 * dedupe-by-ref-plugin
 * Elimina la duplicidad de los módulos devolviendo la referencia de los que tienen un ID numérico
 * @version: 0.0.1
 * @git: https://bitbucket.org/snippets/joaquinfq/KB9Ag
 * @author: Joaquín Fernández
 * @license: MIT
 */

const DedupePlugin = require('webpack/lib/optimize/DedupePlugin')

/**
 * Plugin para eliminar la duplicidad de referencias.
 * `DedupePlugin`, que viene con `webpack`, devuelve la misma
 * función usada como clase pero si se usan como singleton
 * se obtienen 2 referencias diferentes.
 * Lo mismo ocurre si se usan objetos.
 *
 * En realidad webpack debería detectar el mismo archivo y
 * asignarle el mismo ID pero no lo hace.
 *
 * Para usarlo, agregarlo a los plugins de la configuración.
 */
class DedupeByRefPlugin extends DedupePlugin {
  /**
   * Punto de entrada del plugin.
   *
   * @param {Object} compiler Configuración del compilador.
   */
  apply (compiler) {
    super.apply(compiler)
    compiler.plugin(
      'compilation',
      compilation => {
        compilation.mainTemplate.plugin('modules', source => this._onModules(source))
        compilation.mainTemplate.plugin('require', source => this._onRequire(source))
      }
    )
  }

  /**
   * Callback que se ejecutará luego que el plugin `DedupePlugin` haya modificado
   * los módulos.
   *
   * Comentamos la línea que devuelve la referencia para que siga devolviendo el
   * ID numérico asociado al módulo que duplica otro módulo.
   *
   * @method _onModules
   *
   * @param {ConcatSource} source Código fuente que ha ido generando `webpack`.
   *
   * @return {ConcatSource} Código modificado.
   *
   * @protected
   */
  _onModules (source) {
    if (source && Array.isArray(source.children)) {
      let _children = source.children
      for (let _i = 0, _l = _children.length; _i < _l; ++_i) {
        let _source = _children[_i]
        if (typeof _source === 'string' && _source.indexOf('deduplicated modules')) {
          _children[_i] = _source.replace(
            /modules\[i]\s*=\s*modules\[modules\[i]];/,
            '// $1'
          )
        }
      }
    } else {
      console.warn(
        '%s::apply::_onModules - Unexpected type of source',
        this.constructor.name
      )
    }
    return source
  }

  /**
   * Callback que se ejecutará cuando se vaya a renderizar el código
   * bootstrap de `webpack`.
   *
   * Si se detecta un módulo duplicado, se reemplaza exportando la
   * referencia del que ha duplicado y asignándosela al módulo que
   * lo duplica.
   *
   * Webpack en este caso crea un nuevo `exports` lo que ocasiona
   * problemas.
   *
   * @method _onRequire
   *
   * @param {ConcatSource} source Código fuente que ha ido generando `webpack`.
   *
   * @return {ConcatSource} Código modificado.
   *
   * @protected
   */
  _onRequire (source) {
    if (typeof source === 'string') {
      source = source.split('\n').map(
        line => {
          if (line.indexOf('modules[moduleId].call') !== -1) {
            line = `
var m = modules[moduleId];
if (typeof m === 'number')
{
    if (!installedModules[m])
    {
        __webpack_require__(m);
    }
    module.exports = installedModules[m].exports;
}
else
{
    ${line}
}
            `.trim()
          }
          return line
        }
      ).join('\n')
    } else {
      console.warn(
        '%s::apply::_onRequire - Unexpected type of source',
        this.constructor.name
      )
    }
    return source
  }
}

module.exports = DedupeByRefPlugin
