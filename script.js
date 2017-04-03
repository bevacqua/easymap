// devtool script I used to scrape places for data.json on html pages like:
// http://www.estilosdeco.com/negocios/ar/locales-decoracion-palermo/

copy(
  JSON.stringify(
    [...document.querySelectorAll('.entry-content > p')]
      .filter(el => el.innerText.trim().length && el.querySelector('a'))
      .map(el => ({
        href: el.querySelector('a').href,
        name: el.querySelector('a').innerText,
        address: el.childNodes[el.childNodes.length - 1].textContent.slice(2, -1) + `, Buenos Aires, Argentina`
      }))
  , null, 2)
)
