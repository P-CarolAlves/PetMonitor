/* Variaveis globais */
var attTime = 1000; //Tempo para atualizar posição do pet;
var vRange = '20';//Valor inicial do perimetro seguro
var runPetPos = false;
var btAlterta = 'on';
var vPCoord = false;
var autopCoord;

//Inicializa API geoLocalization (W3C)
//documentação API https://www.w3schools.com/html/html5_geolocation.asp
function givLoc() {
    try{
//Utilizado para capturar a posição atual do dispositivo.
//Será chamada automaticamente cada vez que a posição no dispositivo mudar.
//Caso navegador não suporte será chamada função de error "errorCallback".
		options = {
		  enableHighAccuracy: true,//habilitar alta precisão
		  timeout: attTime +500,//Tempo máximo em milissegundo para obter localização
		  maximumAge: 0// tempo máximo que diapositivo ira armazenar posição em cache
		};
        getId = navigator.geolocation.watchPosition(getPos, errorCallback, options);
        alertasound = true;//inicia com alerta ativado caso popup seja reaberto
        btAlterta = 'on';//inicia com botão on caso popup seja reaberto
    }catch(e){
    	closePopup();
        console.error("Não foi possível inicializar a geolocalização: "+e);        
    }
}

function getPos(position){
	try{
/* Pega posição do proprietario */
		tCoord = {lat: position.coords.latitude, lng: position.coords.longitude};

//Pega informações dos input HTML
		var nomepet = document.getElementById('nomepet').value;
		var raca = document.getElementById('raca').value;
		var sexo = document.getElementsByName('sexo');
		for (var i=0;i<sexo.length;i++){
			if (sexo[i].checked == true){
				sexoRaca = sexo[i].defaultValue;
			}
		}
		dadosPet = {nome: nomepet,raca: raca,sexo: sexoRaca};

/* Verifica se mapa ja esta carregado */
		if(!document.getElementById('map')){		

/* Se não estiver carrega container */			
			if(createBox(tCoord) === true){
				var vPCoord = false;
				var	pCoord = getPetPos(tCoord);
/* Insere mapa */
				if (insertMap(pCoord) === true) {
					insertInfo(tCoord,pCoord);
					creatMark(tCoord,pCoord,true);
/* Dispara função que irá gerar a posição do pet */
/* Não suportada no Google Chrome, irá executar apenas uma vez */
					if (runPetPos === false) {
						autopCoord = window.setInterval(function(){getPetPos(tCoord)},attTime);
					}				
				}
			}
		}
	}catch(e){
    	closePopup();
        console.error("Não foi possível obter as informações: "+e);        
    }
}

/* Cria toda parte estrutural do pop-up de localização */
function createBox(tCoord){
	try {
		var sPopup = document.createElement('div');//Cria elemento Div
		sPopup.id = 'shadow-popup';// Atribui Id para DIv criada
		document.body.appendChild(sPopup);//Adiciona Div ao Body
		var boxShadow = document.getElementById('shadow-popup');

//Criando container  do main
		var boxMain = document.createElement('main');//cria um elemento
		boxShadow.appendChild(boxMain);//imprime article dentro do elemento pai
		var boxMain = boxShadow.querySelector('main');

//Criando container  da logo
		var boxLogo = document.createElement('span');
		boxLogo.className = 'logo';//Atribui uma class ao elemento
		boxLogo.textContent = 'PETMonitor';//Insere texto no elemento
		boxMain.appendChild(boxLogo);

//Criando container  do mapa
		var boxMap = document.createElement('div');
		boxMap.id = 'map';//Atribui uma id ao elemento
		boxMain.appendChild(boxMap);
		var boxMap = document.getElementById('map');

//Criando container  do marcador Pet
		var icoP = document.createElement('div');
		icoP.id = 'markerP';
		boxMain.appendChild(icoP);

//Criando container  do marcador Tutor
		var icoT = document.createElement('div');
		icoT.id = 'markerT';
		boxMain.appendChild(icoT);

//Criando container  das cordenadas
		var boxInfo = document.createElement('aside');
		boxInfo.className = 'boxInfo';
		boxMain.appendChild(boxInfo);
		var boxInfo = boxMain.getElementsByClassName('boxInfo');

//cria lista com as informações
		var ulInfo = document.createElement('ul');
		ulInfo.id = 'ulInfo';

		boxInfo[0].appendChild(ulInfo);
		var ulInfo = document.getElementById('ulInfo');

//cria 5 linhas (LI) dentro da ul
		for (var i = 0; i <= 4; i++) {
			var liInfo =document.createElement('li');
			ulInfo.appendChild(liInfo)[i];
		}

//identificando as linhas
		var liInfo = ulInfo.children;

		var txtSeguro = liInfo[0].textContent = 'Perímetro Seguro:';
		var inputRange = liInfo[1].id = 'range';
		var valueRange = liInfo[2].id = 'vrange';
		var valueAtt = liInfo[3].id = 'att';
		var valueDist = liInfo[4].id = 'distPet';

//Cria input  range
		if(range.querySelector('input') == null){
			var inputRange = document.createElement('input')//cria input
//Insere atributos no input
			inputRange.id = 'iRange';
			inputRange.setAttribute('type', 'range');
			inputRange.setAttribute('value', vRange);
			inputRange.setAttribute('min', '0');
			inputRange.setAttribute('max', '100');
			inputRange.setAttribute('step', '10');
			inputRange.setAttribute('onchange','valueRange()');
			range.appendChild(inputRange);//Adiciona input dentro do elemento li#range
		}		
//cria botão fechar
		var boxClose = document.createElement('div');
		boxClose.id = 'popup_close';
		boxClose.setAttribute('onclick', 'closePopup()')
		boxMain.appendChild(boxClose);
		var boxClose = boxMain.getElementsByClassName('boxClose');

		document.body.style.overflow = 'hidden';// Ocuta barra de rolagem
		window.scrollTo(0, 0);//Posiciona navegador no topo da pagina;

		return true;
	}catch(e){
		//Se algo der errado mostra erro console e deleta Popup
		closePopup();
		console.log('Falha ao montar Pop-up: '+e);
	}
}

/*---------------- Insere Mapa ----------------*/
//Com a API de mapa da OpenLayers geramos um mapa
//Documentação https://openlayers.org/en/latest/apidoc/
function insertMap(pCoord){
	try {
//cria cria mapa centralizado nas cordenadas do Pet
    	map = new ol.Map({
        	target: 'map',
        	layers: [
        		new ol.layer.Tile({
        			source: new ol.source.OSM()
        		})
        	],
        	view: new ol.View({
          		center: ol.proj.fromLonLat([pCoord['lng'],pCoord['lat']]),
          		zoom: 19
        	})
    	});
    	return true;

    }catch(e){
    	closePopup();
		console.log('Falha ao inserir mapa: '+e);
	}
}

/* Insere informações no mapa e no boxInfo */
function insertInfo(tCoord,pCoord){
	try{
//Se valor igual "0" range fica off
        if(vRange == 0){var segrang = 'Off';}else{var segrang = vRange+' mt';}	

//limpa as linhas dentro la lista ulInfo e insere novos valores
		for (var i = 2; i <= 4; i++) {
			if(i == 2){var text = segrang;}//Mostra valor do input range na tela
			if(i == 3){var text = formatData(new Date());}//Mostra data da atualização das cordenadas

			if(i == 4){var text = calcDist(tCoord,pCoord)+' mt';}//Mostra distância  entre pet e tutor
			ulInfo.children[i].textContent = text;	

			seguro(calcDist(tCoord,pCoord));
		}
	}catch(e){
		closePopup();
		console.log('Falha ao inserir mapa: '+e);
	}
}

/*---------------- Insere marcadores no mapa ----------------*/
function creatMark(tCoord,pCoord,x){
    try {
    	if(x === true){
// prepara informações para exibir no mapa 
			var iconT = document.getElementById('markerT');
			var iconP = document.getElementById('markerP');
//Informações tutor
			var iTutor = document.createElement('label');
			iTutor.innerHTML  = "<b>Você <br>Lat:</b> "+ tCoord['lat'] + "<br><b>Long:</b> "+ tCoord['lng'];
			iconT.appendChild(iTutor);

			var icoP = document.createElement('label');
			icoP.innerHTML = "<b>"+nomepet+"</b> ("+raca+") "+sexoRaca+"<br><b>Lat:</b> "+ pCoord['lat'] + "<br><b>Long:</b> "+ pCoord['lng'];
			iconP.appendChild(icoP);
//cria marcador do pet   
		markerP = new ol.Overlay({
		     element: iconP,
		     position: ol.proj.fromLonLat([pCoord['lng'],pCoord['lat']])
		 });
		map.addOverlay(markerP);
//cria marcador do tutor  
		markerT = new ol.Overlay({
		     element: iconT,
		     position: ol.proj.fromLonLat([tCoord['lng'],tCoord['lat']])
		 });
		 map.addOverlay(markerT);	 

	    }else if (x === false) {	
	    	updateMark(tCoord,pCoord,markerT,markerP);
	    }
    }catch(e){
    	closePopup();
        console.error('Falha ao gerar marcadores: '+e);
    }
}

/*---------------- Atualiza marcadores no mapa ----------------*/
function updateMark(tCoord,pCoord,markerT,markerP) {
   try {

//Atualiza informações da Label tutor e Animal
   		document.getElementById('markerP').querySelector('label').innerHTML = "<b>"+dadosPet['nome']+"</b> ("+dadosPet['raca']+") "+dadosPet['sexo']+"<br><b>Lat:</b> "+ pCoord['lat'] + "<br><b>Long:</b> "+ pCoord['lng'];
		document.getElementById('markerT').querySelector('label').innerHTML = "<b>Você <br>Lat:</b> "+ tCoord['lat'] + "<br><b>Long:</b> "+ tCoord['lng'];			
    	
//Atualiza posição do marcador
    	markerT.setPosition( ol.proj.fromLonLat([tCoord['lng'],tCoord['lat']]) );
    	markerP.setPosition( ol.proj.fromLonLat([pCoord['lng'],pCoord['lat']]) );

    	seguro(calcDist(tCoord,pCoord));
    }catch(e){
    	closePopup();
        console.error('Falha ao atualizar marcadores: '+e);
    }
}

/* Gera posição do pet */
function getPetPos(tCoord){
	try{
//Gera loalização fictia do pet
//Verifica se ja foi gerada uma localização para o pet
	if(vPCoord === false ){
//Se não Gera uma cordenada ficticia utilizando as cordenadas o tutor para calcular,        
		pLat = parseFloat((tCoord['lat'] +Math.floor(Math.random()* 9999) *0.00000003).toFixed(7));
		pLng = parseFloat((tCoord['lng'] +Math.floor(Math.random()* 9999) *0.00000003).toFixed(7));

		vPCoord = true;
	}else{
//Se a cordenada estiver gerada, gera nova cordenada com base na antiga
//Gera valor negatico ou positivo
		if((Math.floor(Math.random()* 2) *1) == 1){var m = '1';}else{var m ='-1';}
		pLat = parseFloat((pLat +(Math.floor(Math.random()* 99) *0.00000025)*m).toFixed(7));
		pLng = parseFloat((pLng +(Math.floor(Math.random()* 99) *0.00000025)*m).toFixed(7));

		var pCoord = {lat:pLat,lng:pLng};

		creatMark(tCoord,pCoord,false)
	}
//Guarda valores em um objeto
	pCoord = {lat:pLat,lng:pLng};

	return pCoord;
	}catch(e){
		closePopup();
        console.error('Falaha ao gerar posição do animal: '+ e);
    }
}

/*------ Formata Data para dd/mm/aaa h:m -------*/
function formatData(data){
	try {
	    var dia     = '00'+data.getDate();           // 1-31
	    var mes     = data.getMonth();          // 0-11 (zero=janeiro)
	    var ano4    = data.getFullYear();       // 4 dígitos
	    var hora    = '00'+data.getHours();          // 0-23
	    var min     = '00'+data.getMinutes();        // 0-59
	    var str_data = dia.slice(-2)+'/'+('00'+(mes+1)).slice(-2)+'/'+ano4+' - '+hora.slice(-2)+':'+ min.slice(-2);

	    return str_data;
	}catch(e){
		console.error('Falha ao Formatar data: '+e);
	}
}

/*------------ Calcula distância  ------------*/
function calcDist(tCoord,pCoord){
//codigo do calculo retirado:
//http://carlosdelfino.eti.br/cursoarduino/geoprocessamento/calculando-distancia s-com-base-em-coordenadas-de-gps/
    try{
//Extrai valores dos objetos
		var tLat = tCoord['lat'];
		var tLng = tCoord['lng'];
		var pLat = pCoord['lat'];
		var pLng = pCoord['lng'];

        d2r = 0.017453292519943295769236;

        dlong = (pLng - tLng) * d2r;
        dlat = (pLat - tLat) * d2r;

        temp_sin = Math.sin(dlat/2.0);
        temp_cos = Math.cos(tLat * d2r);
        temp_sin2 = Math.sin(dlong/2.0);

        a = (temp_sin * temp_sin) + (temp_cos * temp_cos) * (temp_sin2 * temp_sin2);
        c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));

//Resultado da distância 
		seguro(parseInt((6368.1 * c)*1000));
        return parseInt((6368.1 * c)*1000);
    }catch(e){
        console.error('Falha ao calcular a distância : '+e);
    }
}

/*---------------- Verifica distância  de segurança ----------------*/
function seguro(pDist){
	try {
		var dist = document.getElementById('distPet');
	//Compara distância  do pet com distância  segura
	//Se pet estiver fora muda cor do texto e emite um alerta
		if(pDist >= vRange && vRange !== '0'){
			dist.style.color = '#F00';
			if(btAlterta === 'off'){iconBT = 'z'}else{iconBT = 'x'}
			dist.innerHTML = "<img src='img/alerta.gif' height='35px'><span>"+ pDist+" mt</span> <button id='mute' class='"+btAlterta+"' onclick='btAlertaOnOff()'>"+iconBT+"</button>";

	        alerta('play');//Emite sinal de alerta	
		}else{
			dist.style.color = '#000';
			dist.innerHTML = pDist+" mt";

			alerta('pause');
		}
	}catch(e){
		console.error('Falha ao verificar distância  segura: '+e);
	}
}
/*---------------- Altera botão de alerta para on/off ----------------*/
function btAlertaOnOff(){
	try {
		var bt = document.getElementById('mute');
		if(btAlterta === 'off'){
			bt.innerHTML = 'z';
			btAlterta = 'on';
			alertasound = true;
		}else{
			bt.innerHTML = 'x';
			btAlterta = 'off';
			alerta('pause');
			alertasound = false;
		}
	}catch(e){
		console.error('Falha no botão de alerta: '+e);
	}
}
/*---------------- Alerta Sonoro ----------------*/
function alerta(x){
    try {
    	const audio = document.querySelector('audio');
//Pausa o som de alerta      
        if(x === 'pause'){
            audio.pause();

        }else if (x == 'play' && alertasound === true) {
            audio.play();
        }
//Alter botão alerta para on/off
    }catch(e){
        console.error('Falha ao gerar alerta: '+e);
    }
}
/*---------------- Pega Valor Rage e imprime no campo vRange ----------------*/
function valueRange(){
    try {
//Pega valor de segurança do input range        
    	vRange = document.getElementById('iRange').value;//pega valor do input range
//Se valor igual "0" range fica off
        if(vRange == 0){var segrang = 'Off';}else{var segrang = vRange+' mt';}
        document.getElementById('vrange').innerHTML = segrang;//Imprime valor
    }catch(e){
        console.error('Range: '+ e);
    }
}

/*---------------- Fecha Popup ----------------*/
function closePopup(){
	try {
		var sShadow = document.getElementById('shadow-popup');
		document.body.style.overflowY = 'visible';
		alerta('pause');//Paura o som de alerta
		clearInterval(autopCoord);// Para de gerar posição do pet
		navigator.geolocation.clearWatch(getId);//Para a atualização da navegação
		vPCoord = false;
		document.body.removeChild(sShadow);//remove o popup 
	}catch(e){
		console.error('Falha ao fechar Pop-up: '+e);
	}
}

/*---------------- Erro executar Geolocalização ----------------*/
//Menssagem de erro caso navegador não suporte geolocalização
function errorCallback(error) {
    console.error('Erro ao carregar geolocalização! '+ error);
}