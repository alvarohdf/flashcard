// CONSTANTES
const SinalCardJaFeito = ' --';
const SeparadorPerguntaResposta = '>>';
const MarcadorCloze = '`';
const MarcadorBasic2 = '⇒';
const MarcadorBasic1 = '??';
const MarcadorListaInteira = '<';
const MarcadorBasicAtras = '<~';
const BulletNoCard = '⇒';
const SetaLista = '↪';
const TxtPergunta = 'XXX';

// ---------------- UTIL ----------------

function limpaMarkdownProAnki(txt) {
  let result = txt;

  // proteger marcador cloze
  result = result.replaceAll(MarcadorCloze, 'TEMPMARCADOROK');

  result = result.replaceAll('**', '');
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
    texto.indexOf(MarcadorBasic2) > -1
  ) {
    result = true;
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
	// 1) Extrair clozes
  	tempTexto = card;
	inicioPos = tempTexto.indexOf(marcador);
	while (inicioPos  !== -1) 
	{
		fimPos = tempTexto.indexOf(marcador, inicioPos + marcador.length);
    		if (fimPos === -1) break;
		// equivalente ao Copy
    		clozes.push(tempTexto.substring(inicioPos + marcador.length, fimPos));
		// equivalente ao Delete
		tempTexto = tempTexto.substring(0, inicioPos) + tempTexto.substring(fimPos + marcador.length);
		inicioPos = tempTexto.indexOf(marcador);
	}
  	for (i = 0; i < clozes.length; i++) 
	{
    		textoPergunta = card;
		// A RESPOSTA É SÓ O CLOZE ATIVO
		textoResposta = clozes[i];
		for (j = 0; j < clozes.length; j++) 
		{
			let alvo = marcador + clozes[j] + marcador;

      			if (i === j)
			{
				textoPergunta = textoPergunta.replace(alvo, TxtPergunta);
      			} 
			else
			{
        				textoPergunta = textoPergunta.replace(alvo, '...');
			}
    		}
		resultado +=contexto +textoPergunta +SeparadorPerguntaResposta +textoResposta +'\n'; 
		// equivalente ao sLineBreak
  	}
	return resultado;
}

// ---------------- SETA → CLOZE ----------------

function ConverterSetaParaCloze(texto) 
{
	let resultado = texto;
  	let marcador = MarcadorBasic1;

	// dar espaço antes do marcador ??
	if (!(texto.indexOf(' ' + MarcadorBasic1) > -1)) 
	{
        	texto = texto.replace(MarcadorBasic1, ' ' + MarcadorBasic1);
      	}
	// dar espaço antes do marcador ⇒
      	if (!(texto.indexOf(' ' + MarcadorBasic2) > -1)) 
	{
		texto = texto.replace(MarcadorBasic2, ' ' + MarcadorBasic2);
      	}

  	if (texto.includes(MarcadorBasic2)) 
	{
    		marcador = MarcadorBasic2;
  	}

  	let p = resultado.indexOf(marcador);

  	while (p !== -1)
	{
	    	// início do conteúdo após marcador
    		let fim = p + marcador.length;
		// pula espaços
		while (fim < resultado.length && resultado[fim] === ' ') 
		{
			fim++;
    		}
    		if ( contarTxtNaString(texto, MarcadorBasic1) > 1 || contarTxtNaString(texto, MarcadorBasic2) > 1) 
		{
      			// achar o primeiro ponto
      			while (fim < resultado.length && resultado[fim] !== '.') 
			{
        				fim++;
			}
      		}
		else 
		{
      			// até fim da linha
      			while (fim < resultado.length && resultado[fim] !== '\n' && resultado[fim] !== '\r') 
			{
        				fim++;
      			}
    		}
		// captura conteúdo
    		let conteudo = resultado.substring(p + marcador.length, fim).trim();
		// delimitador
		let delim = '';
		if (fim < resultado.length && (resultado[fim] === ';' || resultado[fim] === '.')) 
		{
      			delim = resultado[fim];
    		}
    		// substituição (equivalente ao Copy do Pascal)
    		resultado = resultado.substring(0, p) +  MarcadorCloze + conteudo + MarcadorCloze + delim + resultado.substring(fim + 1);
		// próximo marcador (equivalente ao PosEx)
    		p = resultado.indexOf(marcador, p + 1);
 	}
	if (texto.indexOf('??') > -1) 
	{
       		resultado = resultado.replace(MarcadorCloze, '?' + ' ' + MarcadorCloze);
	} 
 	return resultado;
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
	if (novoResult.indexOf(MarcadorCloze) > -1) 
	{
		return GerarCardsClozeParaBasic(novoContexto, novoResult, MarcadorCloze);
	} 

}

function ContarTabs(s) {
  let result = 0;
  let espacos = 0;

  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\t') {
      result++;
    } else if (s[i] === ' ') {
      espacos++;
    } else {
      break;
    }
  }

  // equivalente ao "div 3"
  result = result + Math.floor(espacos / 3);

  return result;
}


function TabsLista(linha) {
  let result = '';

  // Ignora se não for item de lista
  if (!linha.trimStart().startsWith('-')) {
    return SetaLista + ' ' + linha;
  }

  // nível = tabs + 1
  let nivelLinha = ContarTabs(linha) + 1;

  // texto sem "-"
  let texto = linha.trim().replace('-', '').trim();

  // equivalente ao DupeString
  result = SetaLista.repeat(nivelLinha) + ' ' + texto;

  return result;
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

  let contexto = '';
  let cardLista = '';
  let tabelaMarkdownFinal = '';

  let cardsCSV = '';

	textoOriginal = textoOriginal.replace(/\\#/g, '#');
	let textoSeraLido = textoOriginal;

	// Mantém original
	let markdownFinal = textoOriginal;
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
      			H1 = linhaTrim.substring(2).trim();
      			contexto = `${H1} - `;
		}
		if (linhaTrim !== '' && !linhasOriginais[i].includes(SinalCardJaFeito)) 
		{
  			// -- É LISTA
			if (linhaSendoAnalisada.trim().endsWith(':') || linhaSendoAnalisada.trim().endsWith('?'))
			{
				if (linhas[i+1].startsWith('-') || linhas[i+2].startsWith('-'))
				{
					contextoLista = linhaSendoAnalisada;
					cardLista += contextoLista;
					i++;
					linhaSendoAnalisada = linhas[i];
					while (i < linhas.length)
					{
						if (linhaSendoAnalisada.trim().startsWith('-'))
						{ // É ITEM LISTA
							if (ProcuraCloze(linhaSendoAnalisada) === true || linhaSendoAnalisada.includes('[]') || linhaSendoAnalisada.trim().endsWith(':')) 
							{
								if (!linhasOriginais[i - 1].includes(SinalCardJaFeito))
								{
				    					cardLista += ' ' + TabsLista(ConverterSetaParaCloze(linhaSendoAnalisada));
  								}
							}
							if (linhaSendoAnalisada.trim().endsWith('.'))
							{
								// TERMINOU PARTE DA LISTA = .
								if (ProcuraCloze(cardLista) === true) 
								{
									cardsCSV += FormatarCards(contexto, cardLista);
									markdownFinal = markdownFinal.replace(linhasOriginais[i], linhasOriginais[i] + SinalCardJaFeito);
									contadorCards++;
									cardLista = '';
									cardLista += contextoLista;
			    					}
							}
						}
						if (!linhas[i+1].trim().startsWith('-'))	
						{ // TERMINOU TODA A LISTA
							break;
						}
						// CONTINUAR, TEM MAIS LISTA.
						i++;
						linhaSendoAnalisada = linhas[i];
					}
				}
			}
			//-- FIM LISTA
			// -- É TABELA
			else if (linhaSendoAnalisada.trim().startsWith('|')) 
			{
				linhasTabela = [];
  				j = 0;
  				k = i; // início da tabela
				while (linhas[i] && linhas[i].trim().startsWith('|')) 
				{
					linhasTabela.push(linhas[i]);
					i++;
					j++;
					if (linhas[i] === '') 
					{
      						i++; // linha em branco entre tabelas
    					}	
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
			// ---------- CARD SETA ----------
			else if (linhaSendoAnalisada.indexOf(MarcadorBasic1) > -1 || linhaSendoAnalisada.indexOf(MarcadorBasic2) > -1)
			{
				cardLista += linhaSendoAnalisada;
				if (!linhaSendoAnalisada.endsWith('.')) // tem mais = PARAGRAFÃO
				{				
					i++;
					linhaSendoAnalisada = linhas[i];
					while (i < linhas.length)
					{
						if (linhaSendoAnalisada.trim() !== '') 
						{
    							cardLista += TabsLista(linhaSendoAnalisada) + ' ';
	 					}
						if (linhaSendoAnalisada.trim().endsWith('.'))
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
				// marcar como feito
        			markdownFinal = markdownFinal.replace(linhasOriginais[i], linhasOriginais[i] + SinalCardJaFeito);
				contadorCards++;
				contextoParagrafo = '';
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
			if (contextoParagrafo !== '') 
			{
				if (linhaSendoAnalisada.endsWith('.')) 
				{
    					contextoParagrafo = '';
  				}
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
	cardsCSV = cardsCSV.replaceAll(',', '.');
	contadorCards = contadorCards * SinalCardJaFeito.length;

	return {
  		cards: cardsCSV,
		markdown: markdownFinal,
		contagem: contadorCards
	};
}