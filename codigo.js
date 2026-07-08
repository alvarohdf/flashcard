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
 // result = result.replaceAll('\t', '');

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
        ' - ' + partesCab[j].trim() + ': ' + celula + '\n';
    }

    resultado = resultado.trim();
    resultado = resultado + '\n'; // sLineBreak
  }
  resultado = limpaMarkdownProAnki(resultado);
  return resultado;
}

function LinhaEContextoParagrafo(linha) 
{
	let result = false;
	let linhaTrim = linha.trim();
	//if (!linhaTrim.endsWith(MarcadorBasic1)  && !linhaTrim.endsWith(MarcadorBasic2)  && (linhaTrim.endsWith(':') || linhaTrim.endsWith('?')))	
	if  (linhaTrim.endsWith(':') || linhaTrim.endsWith('?') || linhaTrim.endsWith(MarcadorBasic1) || linhaTrim.endsWith(MarcadorBasic2))
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

function GerarCardsClozeParaBasic(card)
{
	let clozes = [];
	let inicioPos, fimPos, i, j;
	let textoPergunta, textoResposta, resultado;
	let tempTexto;

	resultado = '';
	card = card.replace(/[\r\n]/g, '');

	// Extrair clozes
	tempTexto = card;
	inicioPos = tempTexto.indexOf(MarcadorCloze);
	while (inicioPos !== -1)
	{
		fimPos = tempTexto.indexOf(MarcadorCloze, inicioPos + MarcadorCloze.length);
		if (fimPos === -1) break;

		clozes.push(
			tempTexto.substring(
				inicioPos + MarcadorCloze.length,
				fimPos
			)
		);

		tempTexto =
			tempTexto.substring(0, inicioPos) +
			tempTexto.substring(fimPos + MarcadorCloze.length);

		inicioPos = tempTexto.indexOf(MarcadorCloze);
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
				let alvo = MarcadorCloze + clozes[j] + MarcadorCloze;

				if (i === j)
					textoPergunta = textoPergunta.replace(alvo, TxtPergunta);
				else
					textoPergunta = textoPergunta.replace(alvo, '...');
			}

			resultado += textoPergunta +
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
			let alvo = MarcadorCloze + clozes[i] + MarcadorCloze;
			textoPergunta = textoPergunta.replace(alvo, TxtPergunta + ' (P' + (i+1) + ')');
		}

		// textoResposta = clozes.join('<br>');

textoResposta = "";

for (i = 0; i < clozes.length; i++)
{
    textoResposta += "R" + (i + 1) + ": " + clozes[i];

    if (i < clozes.length - 1)
    {
        textoResposta += "<br>";
    }
}

		resultado += textoPergunta +
			'tempSeparador' +
			textoResposta + '\n';
	}
	return resultado;
}

// ---------------- SETA → CLOZE ----------------

function ConverterSetaNormalParaCloze(texto)
{
	let resultado = texto.replaceAll(MarcadorBasic2, MarcadorBasic1);

	if (!resultado.includes(MarcadorBasic1))
	{
		return resultado;
	}
	
	let inicioRespostaCardIndex = resultado.indexOf(MarcadorBasic1);

	while (inicioRespostaCardIndex !== -1)
	{
		// Vamos ajustar. Por exemplo: "A >> x B." vai retornar index 3. 
		// Mas queremos index 6, ou seja, a partir do x. 
		// Então eliminamos o outro ">" pegnado length do marcador e eliminamos os espaços

		let inicioRespostaCardIndexAjustado = inicioRespostaCardIndex + MarcadorBasic1.length;

		while (resultado[inicioRespostaCardIndexAjustado] === ' ')
        	{		
			// pula espaços
            		inicioRespostaCardIndexAjustado++;
		}

		// DETERMINAR FINAL DA PRIMEIRA RESPOSTA
		let finalRespostaCardIndex;

		
		// Procura se existe outro marcador após o atual
		const proximoMarcadorIndex = resultado.indexOf(MarcadorBasic1, inicioRespostaCardIndex + MarcadorBasic1.length);

		if (proximoMarcadorIndex === -1) // NÃO EXISTE OUTRO >>
		{
			finalRespostaCardIndex = resultado.lastIndexOf('.');
		}
		else
		{
			// procura o ; que termina a resposta
			//       		 	finalRespostaCardIndex = resultado.indexOf(MultiplasSetasSinalFinal, inicioRespostaCardIndexAjustado);


 // Descobre em que linha está o marcador atual
    const fimLinhaAtual = resultado.indexOf('\n', inicioRespostaCardIndex);

    // Se não houver quebra ou o próximo marcador estiver na mesma linha,
    // continua usando ';' para separar respostas.
    if (fimLinhaAtual === -1 || proximoMarcadorIndex < fimLinhaAtual)
    {
        finalRespostaCardIndex = resultado.indexOf(
            MultiplasSetasSinalFinal,
            inicioRespostaCardIndexAjustado
        );
    }
    else
    {
        // Próximo marcador está em outra linha.
        // A resposta termina no início da linha do próximo marcador.
        finalRespostaCardIndex =
            resultado.lastIndexOf('\n', proximoMarcadorIndex) + 1;
    }

		}

      		if (finalRespostaCardIndex === -1)
        	{
			// importante pois vamos simular. Entrada:  "teste ?? oi; vc ?? sim."
			// Primeira iteração inicioRespostaCardIndex  Encontra o ; 
			// Tudo certo. 
			// Depois você faz: resultado = resultado.substring(0, inicioRespostaCardIndex) + "`oi`" + resultado.substring(fim);
			// O resultado vira algo como: teste `oi`; vc ?? sim. Até aqui tudo bem.
			// Segunda iteração Agora você procura o próximo ??. Ele encontra: vc ?? sim. 
			// Mas agora: resultado.indexOf(";", inicio) retorna -1 porque a última resposta termina com . e não com ;

			finalRespostaCardIndex = resultado.lastIndexOf('.');

			if (finalRespostaCardIndex === -1)
			{
				finalRespostaCardIndex = resultado.length;
       		 	}
		}


	        let resposta = resultado.substring(inicioRespostaCardIndexAjustado, finalRespostaCardIndex + 1).trim();
		
		resultado = resultado.substring(0, inicioRespostaCardIndex) +
			MarcadorCloze + resposta + MarcadorCloze + resultado.substring(finalRespostaCardIndex);
		
		// procura a próxima seta depois da resposta recém-processada

		inicioRespostaCardIndex = resultado.indexOf(MarcadorBasic1, inicioRespostaCardIndex + MarcadorCloze.length + resposta.length + MarcadorCloze.length);
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

function ConverterSetas(card) 
{
	card = card.replace(MarcadorBasic1, '? ??');
	if (card.includes(MarcadorBasic1) && card[card.indexOf(MarcadorBasic1) - 1] != " ")
	{
		card = card.replace(MarcadorBasic1, ' ' + MarcadorBasic1);
	}
	if (card.indexOf(MarcadorBasic1) > -1 || card.indexOf(MarcadorBasic2) > -1)
	{
        	card = ConverterSetaNormalParaCloze(card);	
	}
	if (card.indexOf(MarcadorSetaInversa) > -1)
	{
		card = ConverterSetaInversaParaCloze(card);
	}
	return card;
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

    let texto = linha.trimStart().replace(/^-\s*/, '');

    // Não é item de lista (sem indentação e sem "-")
    if (espacos === 0 && !linha.trimStart().startsWith('-'))
    {
        return texto;
    }

    let nivel = Math.floor(espacos / 3) + 1;

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
			contextoParagrafo = '';
		}
    		else if (linhaTrim.startsWith('###')) 
		{
      			H3 = linhaTrim.substring(3).trim();
     			contexto = `${H1} - ${H2} - ${H3} - `;
			contextoParagrafo = '';
    		}
		else if (linhaTrim.startsWith('##')) 
		{
			H2 = linhaTrim.substring(2).trim();
			contexto = `${H1} - ${H2} - `;
			contextoParagrafo = '';
    		}
    		else if (linhaTrim.startsWith('# ')) 
		{
			contextoParagrafo = '';
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
		// -- OBTER CONTEXTOS
		if (LinhaEContextoParagrafo(linhaSendoAnalisada)) 
		{
			if (contextoParagrafo != '')
			{
				contextoParagrafo += ' - ' + linhaSendoAnalisada;
			}
			else
			{
				contextoParagrafo = linhaSendoAnalisada;
			}
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
						cardsCSV += contexto + GerarCardsClozeParaBasic(ConverterSetas(TabelaFormatoTexto(linhasTabela[0], linhasTabela[j])));
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
			// PEGAR TUDO ATÉ PONTO FINAL
			else if ((linhaSendoAnalisada.trim().endsWith('>>') || linhaSendoAnalisada.trim().endsWith('??'))) 
			{
				let linha1 = linhaSendoAnalisada;
//				cardLista += linha1; 
				// marcar como feito já na primeira linha; se marcar na última, não vai adiantar nada! Vai duplicar card
        			markdownFinal = markdownFinal.replace(linhasOriginais[i], linhasOriginais[i] + SinalCardJaFeito);

				// Capturar linhas				
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
    						cardLista += TabsLista(linhaSendoAnalisada) + '\n';
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
				// Checar se tem marcador após o >> final. Ex: 
				// Teste >>
				// Exemplo `sim`.
				// No ex. acima precisa eliminar o >> do teste.

				if (ProcuraCloze(cardLista) == true)
				{
					let indexUltimoMarcador;
					indexUltimoMarcador = contextoParagrafo.lastIndexOf(MarcadorBasic1);
					if (indexUltimoMarcador !== -1)
					{
						contextoParagrafo = contextoParagrafo.slice(0, indexUltimoMarcador) + contextoParagrafo.slice(indexUltimoMarcador + MarcadorBasic1.length);
					}
					indexUltimoMarcador = contextoParagrafo.lastIndexOf(MarcadorBasic2);
					if (indexUltimoMarcador !== -1)
					{
						contextoParagrafo = contextoParagrafo.slice(0, indexUltimoMarcador) + contextoParagrafo.slice(indexUltimoMarcador + MarcadorBasic2.length);
					}
				}
//				let ProcuraClozeSemSerPrimeiraLinhaCardLista = cardLista;
//				ProcuraClozeSemSerPrimeiraLinhaCardLista = cardLista.replace(linha1, '');
//				if (ProcuraCloze(ProcuraClozeSemSerPrimeiraLinhaCardLista) == true)
//				{
//					let linha1semomarcadorfinal;
//					let indexUltimoMarcador;
//					indexUltimoMarcador = linha1.lastIndexOf(MarcadorBasic1);
//					linha1semomarcadorfinal = linha1.slice(0, indexUltimoMarcador) + linha1.slice(indexUltimoMarcador + MarcadorBasic1.length);
//					indexUltimoMarcador = linha1.lastIndexOf(MarcadorBasic2);
//					linha1semomarcadorfinal = linha1.slice(0, indexUltimoMarcador) + linha1.slice(indexUltimoMarcador + MarcadorBasic2.length);
//					cardLista = cardLista.replace(linha1, linha1semomarcadorfinal);
//				}
				cardLista = ConverterSetas(contexto + contextoParagrafo + cardLista);
				cardsCSV += GerarCardsClozeParaBasic(cardLista);
				cardLista = '';
				contadorCards++;
		//		contextoParagrafo = '';
				TemTabela = false;
			}
			// PEGAR SÓ LINHA
			else 
			{
				if (ProcuraCloze(linhaSendoAnalisada) === true && LinhaEContextoParagrafo(linhaSendoAnalisada) === false) 
				{
					cardsCSV += GerarCardsClozeParaBasic(ConverterSetas(contexto + contextoParagrafo + linhaSendoAnalisada));
					markdownFinal = markdownFinal.replace(linhasOriginais[i], linhasOriginais[i] + SinalCardJaFeito);
					contadorCards++;
				}
			}
		}
		// resetar contexto paragrafo
		if ( (contextoParagrafo !== '') && (linhaSendoAnalisada.trim().endsWith('.')) && (!linhaSendoAnalisada.trim().endsWith('...')) )
           	{
			if ( (linhaSendoAnalisada.trim().startsWith('-')) && (linhas[i+1].trim() == ""))
			{
				contextoParagrafo = '';
				// aqui pega por ex:
				// TESTE:
				// - A.
				// - B.
				//
				// OI:
				// -C .
				// Então eu não deixo ficar TESTE: - OI :
			}
			if (!linhaSendoAnalisada.trim().startsWith('-'))
			{
    				contextoParagrafo = '';
			}
		}
		// -- OBTER CONTEXTOS joguei para cima era aqui
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
