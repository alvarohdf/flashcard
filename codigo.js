// CONSTANTES
const SinalCardJaFeito = ' OK!';
const SeparadorPerguntaResposta = ';'; // >> = remnote
const MarcadorCloze = '`';
const MarcadorBasic2 = '>>'; //⇒
const MarcadorBasic1 = '??';
const MarcadorListaInteira = '<';
const MarcadorSetaInversa = '<<';
const BulletNoCard = '⇒';
const SetaLista = '↪';
const TxtPergunta = 'XXX';
const CaractereListaPraIncluirMesmoSemCard = '[]';
const MultiplasSetasSinalFinal = ';';
const CadaCloze1Card = '[2]';
// ---------------- UTIL ----------------

function limpaMarkdownProAnki(txt) {
  let result = txt;

  // proteger marcador cloze
  result = result.replaceAll(MarcadorCloze, 'TEMPMARCADOROK');

  result = result.replaceAll('**', '');
  result = result.replaceAll('::', '');
  result = result.replaceAll('==', '');
  result = result.replaceAll('[[', '');
  result = result.replaceAll(']]', '');
  result = result.replaceAll('%%', '');

  // restaurar marcador cloze
  result = result.replaceAll('TEMPMARCADOROK', MarcadorCloze);

  // remover TAB (\t = #9)
  result = result.replaceAll('\t', '');

  return result;
}

function contarTxtNaString(texto, termo) {
  return (texto.length - texto.replaceAll(termo, '').length) / termo.length;
}

function TabelaFormatoTexto(cabecalho, entrada) {
  let resultado = '';

  let partesCab = cabecalho.split('|');
  let linhas = entrada.split(/\r?\n/); // equivalente ao #13#10

  for (let i = 0; i < linhas.length; i++) {

    if (
      linhas[i].includes('---') ||
      linhas[i].trim() === ''
    ) {
      continue;
    }

    let partes = linhas[i].split('|');

    // Primeira coluna
    let titulo = (partes[1] || '').trim();

    if (titulo === '') continue;

    resultado = partesCab[1].trim() + ' - ' + titulo;

    // Demais colunas
    for (let j = 2; j < partesCab.length - 1; j++) {

      let celula = (partes[j] || '').trim();

      resultado =
        resultado +
        ' - ' + partesCab[j].trim() + ': ' + celula;
    }

    resultado = resultado + '\n'; // sLineBreak
  }

  resultado = resultado.trim();
  resultado = limpaMarkdownProAnki(resultado);

  return resultado;
}

function LinhaEContextoParagrafo(linha) 
{
	let result = false;
	let linhaTrim = linha.trim();
	if (linhaTrim.endsWith(':') ||linhaTrim.endsWith('?') || linhaTrim.endsWith(MarcadorBasic1)) 
	{
    		result = true;
  	}
  	return result;
}

function ProcuraCloze(texto) {
  let result = false;

  if (
    texto.indexOf(MarcadorCloze) > -1 ||
    texto.indexOf(MarcadorBasic1) > -1 ||
    texto.indexOf(MarcadorBasic2) > -1 ||
    texto.indexOf(MarcadorSetaInversa) > -1
  ) {
    result = true;
  }
if (texto.includes(SinalCardJaFeito)) // N incluir se ja feito
{
	result = false;
}

  return result;
}

// ---------------- CLOZE ----------------

function GerarCardsClozeParaBasic(contexto, card, marcador)
{
	let clozes = [];
	let inicioPos, fimPos, i, j;
	let textoPergunta, textoResposta, resultado;
	let tempTexto;

	resultado = '';

	// Extrair clozes
	tempTexto = card;
	inicioPos = tempTexto.indexOf(marcador);

	while (inicioPos !== -1)
	{
		fimPos = tempTexto.indexOf(marcador, inicioPos + marcador.length);
		if (fimPos === -1) break;

		clozes.push(
			tempTexto.substring(
				inicioPos + marcador.length,
				fimPos
			)
		);

		tempTexto =
			tempTexto.substring(0, inicioPos) +
			tempTexto.substring(fimPos + marcador.length);

		inicioPos = tempTexto.indexOf(marcador);
	}

	// Modo antigo: 1 card por cloze
	if (card.includes(CadaCloze1Card))
	{
		for (i = 0; i < clozes.length; i++)
		{
			textoPergunta = card;
			textoResposta = clozes[i];

			for (j = 0; j < clozes.length; j++)
			{
				let alvo = marcador + clozes[j] + marcador;

				if (i === j)
					textoPergunta = textoPergunta.replace(alvo, TxtPergunta);
				else
					textoPergunta = textoPergunta.replace(alvo, '...');
			}

			resultado += contexto + textoPergunta +
				'tempSeparador' +
				textoResposta + '\n';
		}
	}
	// Novo modo: todos os clozes em 1 único card
	else
	{
		textoPergunta = card;

		for (i = 0; i < clozes.length; i++)
		{
			let alvo = marcador + clozes[i] + marcador;
			textoPergunta = textoPergunta.replace(alvo, TxtPergunta);
		}

		textoResposta = clozes.join('<br>');

		resultado += contexto + textoPergunta +
			'tempSeparador' +
			textoResposta + '\n';
	}

	return resultado;
}

// ---------------- SETA → CLOZE ----------------

function ConverterSetaParaCloze(texto)
{
    let resultado = texto;

    // dar espaço antes do marcador ??
    if (!(resultado.indexOf(' ' + MarcadorBasic1) > -1))
    {
        resultado = resultado.replace(MarcadorBasic1, ' ' + MarcadorBasic1);
    }

    // dar espaço antes do marcador >>
    if (!(resultado.indexOf(' ' + MarcadorBasic2) > -1))
    {
        resultado = resultado.replace(MarcadorBasic2, ' ' + MarcadorBasic2);
    }

    // padronizar >> para ??
    resultado = resultado.replaceAll(MarcadorBasic2, MarcadorBasic1);

    let p = resultado.indexOf(MarcadorBasic1);

    while (p !== -1)
    {
        let fim = p + MarcadorBasic1.length;

        while (fim < resultado.length && resultado[fim] === ' ')
        {
            fim++;
        }

	let qtdeMarcadoresLinha = contarTxtNaString(resultado, MarcadorBasic1) + contarTxtNaString(resultado, MarcadorCloze);
		
// múltiplos cozes
        if (qtdeMarcadoresLinha > 1)
        {
            while (
                fim < resultado.length &&
                resultado[fim] !== MultiplasSetasSinalFinal
            )
            {
                fim++;
            }
        }
        else
        {
            while (
                fim < resultado.length &&
                resultado[fim] !== '\n' &&
                resultado[fim] !== '\r'
            )
            {
                fim++;
            }
        }

        let conteudo = resultado.substring(
            p + MarcadorBasic1.length,
            fim
        ).trim();

        let delim = '';

        if (
            fim < resultado.length &&
            (resultado[fim] === ';' || resultado[fim] === '.')
        )
        {
            delim = resultado[fim];
        }
        
		resultado =
            resultado.substring(0, p) +
         MarcadorCloze +
            conteudo +
            MarcadorCloze +
            delim +
            resultado.substring(fim + 1);

        p = resultado.indexOf(MarcadorBasic1, p + 1);
    }

    if (
        resultado.indexOf(MarcadorBasic1) > -1 ||
        texto.indexOf(MarcadorBasic2) > -1
    )
    {
        resultado = resultado.replace(
            MarcadorCloze,
            '? ' + MarcadorCloze
        );
    }

    return resultado;
}

function ConverterSetaInversaParaCloze(texto) 
{
  if (!texto.includes(MarcadorSetaInversa)) return texto;

  let partes = texto.split(MarcadorSetaInversa);

  let esquerda = partes[0].trim();
  let direita = partes[1].trim();

  return MarcadorCloze + esquerda + MarcadorCloze + ' ➜ ' + direita;
}

// ---------------- FORMATAR ----------------

function FormatarCards(contexto, cards) 
{
	let novoContexto;
	let novoResult;
	novoContexto = limpaMarkdownProAnki(contexto);
    	novoResult = limpaMarkdownProAnki(cards);
	if (novoResult.indexOf(MarcadorBasic1) > -1 || novoResult.indexOf(MarcadorBasic2) > -1)
	{
        	novoResult = ConverterSetaParaCloze(novoResult);	
	}
	if (novoResult.indexOf(MarcadorSetaInversa) > -1)
	{
		novoResult = ConverterSetaInversaParaCloze(novoResult);
	}
	if (novoResult.indexOf(MarcadorCloze) > -1) 
	{
		return GerarCardsClozeParaBasic(novoContexto, novoResult, MarcadorCloze);
	} 

}


function TabsLista(linha)
{
	let espacos = 0;

	for (let i = 0; i < linha.length; i++)
	{
		if (linha[i] === ' ')
			espacos++;
		else if (linha[i] === '\t')
			espacos += 3;
		else
			break;
	}

	let nivel = Math.floor(espacos / 3) + 1;

	let texto = linha.trimStart().replace(/^-\s*/, '');

	return SetaLista.repeat(nivel) + ' ' + texto;
}

// ---------------- PRINCIPAL ----------------

function criarCartoes(textoOriginal) 
{
  let i = 0, j = 0, k = 0, contadorCards = 0;

  let linhas = [];
  let linhasOriginais = [];

  let H1 = '', H2 = '', H3 = '', H4 = '';
  let contextoParagrafo = '';
  let contextoLista = '';
  let contextoListaJaInserido = false;

  let linhaSendoAnalisada = '';
  let linhasTabela = [];

	let AssuntoNomeArq = ''
  let contexto = '';
  let cardLista = '';
  let tabelaMarkdownFinal = '';
  let TemTabela = false;
  let TabelaLinhaHeader = '';

  let cardsCSV = '';

	textoOriginal = textoOriginal.replace(/\\#/g, '#');
	let textoSeraLido = textoOriginal;

	// Markdown final
	let markdownFinal = textoOriginal;
	
	// Modificar texto será lido
	textoSeraLido = limpaMarkdownProAnki(textoSeraLido);
  	textoSeraLido = textoSeraLido.replaceAll(SinalCardJaFeito, '');
  	textoSeraLido = textoSeraLido.replaceAll('→', '➜');

  	linhas = textoSeraLido.split('\n');
	linhas.push('', ''); // acrescenta duas em branco pra evitar erros pois eu faço leituras [i+1, i+2]
  	linhasOriginais = textoOriginal.split('\n');
	
	while (i < linhas.length)
 	{
		cardLista = '';
		linhaSendoAnalisada = linhas[i];
    		let linhaTrim = linhaSendoAnalisada.trim();

		// ---------- TÍTULOS ----------
    		if (linhaTrim.startsWith('####')) 
		{
      			H4 = linhaTrim.substring(4).trim();
			contexto = `${H1} - ${H2} - ${H3} - ${H4} - `;
		}
    		else if (linhaTrim.startsWith('###')) 
		{
      			H3 = linhaTrim.substring(3).trim();
     			contexto = `${H1} - ${H2} - ${H3} - `;
    		}
		else if (linhaTrim.startsWith('##')) 
		{
			H2 = linhaTrim.substring(2).trim();
			contexto = `${H1} - ${H2} - `;
    		}
    	else if (linhaTrim.startsWith('# ')) 
		{
      			if (AssuntoNomeArq !== '') 
				{
					H1 =  AssuntoNomeArq + ' - ' + linhaTrim.substring(2).trim();
				}
				else
				{
					H1 = linhaTrim.substring(2).trim();
				} 
				contexto = `${H1} - `;			
		}
		else if (linhaTrim.startsWith('ARQ '))
		{
				AssuntoNomeArq = linhaTrim.substring(4).trim();
				contexto = `${AssuntoNomeArq} - `;
		}
		if (linhaTrim !== '' && !linhasOriginais[i].includes(SinalCardJaFeito)) 
		{
			// -- É TABELA
			if (linhaSendoAnalisada.trim().startsWith('|')) 
			{
				linhasTabela = [];
  				j = 0;
  				k = i; // início da tabela
				while (linhas[i] && linhas[i].trim().startsWith('|')) 
				{
					linhasTabela.push(linhas[i]);
					i++;
				//	j++;
  				}
				// -- INICIAR CARDS TABELA --
  				for (j = 0; j < linhasTabela.length; j++) 
				{
					if (ProcuraCloze(linhasTabela[j]) === true) 
					{
						cardsCSV += FormatarCards(contexto, TabelaFormatoTexto(linhasTabela[0], linhasTabela[j]));
						// MARKDOWN FINAL
						let posBarraFinal = linhasOriginais[k].lastIndexOf('|');
						let textoAntesBarra = linhasOriginais[k].substring(0, posBarraFinal);
						let tabelaMarkdownFinal = linhasOriginais[k].replace(textoAntesBarra, textoAntesBarra.trim() + SinalCardJaFeito);
						markdownFinal = markdownFinal.replace(linhasOriginais[k], tabelaMarkdownFinal);
						contadorCards++;
					}
					k++;
					if (linhasOriginais[k] === '') 
					{
      						k++;
					}
				}
			}
			// -- CARD NORMAL
			else if (linhaSendoAnalisada.indexOf(MarcadorBasic1) > -1 || linhaSendoAnalisada.indexOf(MarcadorBasic2) > -1)
			{
				cardLista += TabsLista(linhaSendoAnalisada);
				// marcar como feito já na primeira linha; se marcar na última, não vai adiantar nada! Vai duplicar card
        			markdownFinal = markdownFinal.replace(linhasOriginais[i], linhasOriginais[i] + SinalCardJaFeito);

				if (!linhaSendoAnalisada.trim().endsWith('.')) // tem mais = PARAGRAFÃO, LISTA.
				{ // Não pode ser ; pois se eu quiser colocar um paciente deitado: - próxima linha?				
					while (i + 1 < linhas.length)
					{
    						i++;		
						linhaSendoAnalisada = linhas[i];
						
						if (linhaSendoAnalisada.trim().startsWith('|'))
						{
							if (TemTabela == false)
							{
								TabelaLinhaHeader = linhaSendoAnalisada;
								linhaSendoAnalisada = '';
							}
							else
							{
								if (linhaSendoAnalisada.includes('| - |'))
								{
									linhaSendoAnalisada = '';
								}
								else
								{
									linhaSendoAnalisada = TabelaFormatoTexto(TabelaLinhaHeader, linhaSendoAnalisada);
								}
							}
							TemTabela = true;
						}

						if (linhaSendoAnalisada.trim() !== '') 
						{
    							cardLista += TabsLista(linhaSendoAnalisada) + ' ';
	 					}
						if (linhaSendoAnalisada.trim().endsWith('.'))
   						{
							break;
  						}
						if (TemTabela &&(i + 1 >= linhas.length ||linhas[i + 1].trim() === ''))
						{
							break;
						}
					}
				}
				if (contextoParagrafo !== '') 
				{
					cardsCSV += FormatarCards(contexto + contextoParagrafo, cardLista);
				} 
				else 
				{
					cardsCSV += FormatarCards(contexto, cardLista);
				}
				cardLista = '';
				contadorCards++;
		//		contextoParagrafo = '';
				TemTabela = false;
			}
			// ---------- CARD ÚNICO com cloze provavelmente
			else 
			{
				if (ProcuraCloze(linhaSendoAnalisada) === true && LinhaEContextoParagrafo(linhaSendoAnalisada) === false) 
				{
					// APLICAR CONTEXTO PARÁGRAFO
					if (contextoParagrafo !== '') 
					{
						cardsCSV += FormatarCards(contexto + contextoParagrafo, ConverterSetaParaCloze(linhaSendoAnalisada));
					} 
					else 
					{
						cardsCSV += FormatarCards(contexto, ConverterSetaParaCloze(linhaSendoAnalisada));
					}
					markdownFinal = markdownFinal.replace(linhasOriginais[i], linhasOriginais[i] + SinalCardJaFeito);
					contadorCards++;
				}
			}
			// resetar contexto paragrafo
			if ((contextoParagrafo !== '') && (!linhaSendoAnalisada.trim().startsWith('-')))
            {
    				contextoParagrafo = '';
			}
			// -- OBTER CONTEXTOS
			if (LinhaEContextoParagrafo(linhaSendoAnalisada)) 
			{
				contextoParagrafo = linhaSendoAnalisada + ' ';
			}
		}
		i++;
	}
	// FINAL
	markdownFinal = markdownFinal.replaceAll('%%', '**');

	if (SeparadorPerguntaResposta === ',')
	{
		cardsCSV = cardsCSV.replaceAll(',', '.');
	}	
	if (SeparadorPerguntaResposta === ';')
	{
		cardsCSV = cardsCSV.replaceAll(';', ',');
	}	
	cardsCSV= cardsCSV.replaceAll('tempSeparador', SeparadorPerguntaResposta);
	contadorCards = contadorCards * SinalCardJaFeito.length;

	return {
  		cards: cardsCSV,
		markdown: markdownFinal,
		contagem: contadorCards
	};
}
function exportarCSV(texto) 
{
  const agora = new Date();

  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');

  const hora = String(agora.getHours()).padStart(2, '0');
  const minuto = String(agora.getMinutes()).padStart(2, '0');

  const nomeArquivo = `cards_${dia}${mes}_${hora}${minuto}.csv`;

  // 👇 adiciona BOM para corrigir acentuação no Excel
  const conteudo = "\uFEFF" + texto;

  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = nomeArquivo;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
