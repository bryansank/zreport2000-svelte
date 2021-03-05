<script>

	import { onMount } from 'svelte';

	let restCode = "0";
	let term = "TERM1";
	let flag = false;
	let flagErr = true;
	let userId;
	let user;
	let dateLastSale;
	//let prueba;
	let valDateInput;
	let dataLastSales = {};
	//let dateNow = new Date(Date.now()).toLocaleDateString();

	onMount(() => {
		showWaitMsg();
		doServerMethodObservable("GetUserInfo", {}, "InventoryModule/InventoryWebMethods.aspx/")
		.subscribe(
			//success
			(data)=>{
				hideWaitMsg();
				console.log("succes", data);
				let getInfo = data;
				restCode = getInfo.Warehouse;
				userId = getInfo.UserId;
				user = getInfo.LoginName;
				return (restCode,userId,user);
			}, 
			//error
			(err)=>{
				hideWaitMsg();
				console.log(err);
				alert("Hubo un error en la carga de datos.");
			},
		);
	});
	
	function doServerMethodObservable(methodName, params, root) {
		var isShpModeFlag = (window._spPageContextInfo) ? true: false; 

		if (isShpModeFlag){
			var svcUrl =  _spPageContextInfo.siteServerRelativeUrl + "/_layouts/" + root  + methodName;	
			if (!params)
				params = "{}"
			
			//showWaitMsg();
			
			return rxjs.ajax.ajax.post(
				svcUrl, params, { 'Content-Type': 'application/json' }
				).pipe(rxjs.operators.map(function (e) { return e.response.d })
			);    
		} else {
		// MOCKUP VALUES FOR TESTING 
		return rxjs.Observable.create(function(observer){	
			observer.next([]);
			observer.complete();		 
		}); 
		}
	}

	function getFocus(idhtml){
  		document.getElementById(idhtml.toString()).focus();
	}

	function enableInputs(test="prod"){
		if(test=="prod"){
			let cont=0;
			for (var i = cont; i <= 9; i++) {
				window.$("input[type='text']")[i].disabled = false;
			}
		}else{
			let cont=1;
			for (var i = cont; i <= 9; i++) {
				window.$("input[type='text']")[i].disabled = false;
			}
		}
		
		window.$("button")[1].disabled = false;
	}

	function cleanInputs(test="prod"){
		if(test=="prod"){
			let cont=0;
			for (var i = cont; i <= 9; i++) {
				window.$("input[type='text']")[i].value = "";
			}
		}else{
			let cont=1;
			for (var i = cont; i <= 9; i++) {
				window.$("input[type='text']")[i].value = "";
			}
		}
	}

	function errorShow(menssage,idFocus, forBy = " "){
		alert("Error con: " + menssage + " " + forBy);
		document.getElementById(idFocus).value = "";
		getFocus(idFocus.toString());
	}

	function errorInputForm(data, menssage, idFocus, type="string"){
		//debugger;
		if(flagErr){

			if(type=="string"){//Cadenas

				if(data.length > 8 || data.length == 0 || data == ""){
					errorShow(menssage,idFocus);
					return (flag = false, flagErr = false);
				}else{
					return (flag = true, flagErr = true);
				}

			}else{//Montos Numeros: "48484,48"
				if(data.length < 18){
					//let f = parseFloat(a).toFixed(3);
					data.replace(",",".");
					let a = data.split(".");

					if(a.length == 1){
						document.getElementById(idFocus).value = parseFloat(a[0]).toFixed(2);
						return (flag = true, flagErr = true);
					}else if(a.length == 2){

						if(a[1].length > 2){
							let b = a[1].toString().substring(0,2);
							document.getElementById(idFocus).value = a[0].toString() + "." + b.toString();
							return (flag = true, flagErr = true);

						}else{
							document.getElementById(idFocus).value = a[0].toString() + "." + a[1].toString();
							return (flag = true, flagErr = true);
						}

					}else{//Hay mas de 2 puntos. (Los descarto)
						errorShow(menssage,idFocus);
						return (flag = false, flagErr = false);
					}

				}else{//Mayor a 18 digitos
					errorShow(menssage,idFocus,"Mayor a 18 Digitos");
					return (flag = false, flagErr = false);
				}
			}

		}else{
			console.log("flagErr TRUE");
			return (flag = false, flagErr = true);
		}
	}

	const onReqLastSale = (e)=>{

		//Prevent reload.
		showWaitMsg();
		e.preventDefault();
		valDateInput = document.getElementById("dateSale").value;
		let verifySale = {datSales : valDateInput, term : term, rest: restCode};

		if(verifySale.rest == "0"){
			alert("Elija su fecha de Venta.");
			getFocus("dateSale");
		}else{
			//console.log(verifySale);
			let dateFormat;
			let dateNotFormat = verifySale.datSales.toString();

			if(typeof dateNotFormat === 'string' && dateNotFormat.length > 6){
				dateFormat = dateNotFormat.split("-");
				dateFormat = dateFormat[2].toString() +"/"+ dateFormat[1].toString() +"/"+  dateFormat[0].toString();
				//console.log(dateFormat)
				verifySale.datSales = dateFormat;
				//console.log(verifySale);
				doServerMethodObservable("GetLastSalesSumaryWithMemoryFull", JSON.stringify(verifySale), "SalesPrinterModules/SalesPrinterweb.aspx/").subscribe(
					//success
					(data)=>{
						hideWaitMsg();
						console.log("Success: ", data);
						dataLastSales = data;
						enableInputs();

						dateLastSale = data.datLastInvoiceDate
						dateLastSale = parseInt(dateLastSale.replace("/Date(", "").replace(")/", ""));
						dateLastSale = new Date(dateLastSale).toLocaleDateString("en-US");
						
						cleanInputs();

						return (dataLastSales,dateLastSale);
					}, 
					//error
					(err)=>{
						hideWaitMsg();
						console.log(err);
						alert("error");
					},
					//completed
					(data)=>{
						//console.log("comp:", data);
						//return data;
					}
				);

    		}else{
				alert("Error");
			}
			
		}
	};

	const onSendSale = (e)=>{
		
		e.preventDefault();
        showWaitMsg();
		
		let strLastInvoiceNumber = document.getElementById('LastFact').value;
		let strLastCreditNote = document.getElementById('LastCreditNote').value;
		let strLastNonFiscalDoc = document.getElementById('LastDocNoFiscal').value;

		let dblExentAmount = document.getElementById('MontExent').value;
		let dblGeneralTaxSales = document.getElementById('MontBase').value;
		let dblGeneralTaxAmount = document.getElementById('MontIva').value;

		let dblRefundExentAmount = document.getElementById('CreditNoteExent').value;
		let dblRefundGeneralTaxSales = document.getElementById('CreditNoteBase').value;
		let dblRefundGeneralTaxAmount = document.getElementById('CreditNoteIva').value;

		errorInputForm(strLastInvoiceNumber,"Ultima Factura","LastFact");
		errorInputForm(strLastCreditNote,"Ult Nota de Credito","LastCreditNote");
		errorInputForm(strLastNonFiscalDoc,"Ult Doc No Fiscal","LastDocNoFiscal");

		errorInputForm(dblExentAmount,"Monto Exento","MontExent", "int");
		errorInputForm(dblGeneralTaxSales,"Monto Base","MontBase", "int");
		errorInputForm(dblGeneralTaxAmount,"Monto IVA","MontIva", "int");

		errorInputForm(dblRefundExentAmount,"Nta Credito Exento","CreditNoteExent", "int");
		errorInputForm(dblRefundGeneralTaxSales,"Nta Credito Base","CreditNoteBase", "int");
		errorInputForm(dblRefundGeneralTaxAmount,"Nta Credito IVA","CreditNoteIva", "int");

		flagErr = true;

		if(flag){

			cleanInputs();
			console.log(valDateInput);

			let IntRevId = term.charAt(term.length - 1);

			let dateValue = formatDate(valDateInput);

			let dataSendInsertForTerminals = {
				"strLastInvoiceNumber" : strLastInvoiceNumber, 
				"strLastCreditNote": strLastCreditNote, 
				"strLastNonFiscalDoc" : strLastNonFiscalDoc, 
				"dblExentAmount" : parseFloat(dblExentAmount), 
				"dblGeneralTaxSales" : parseFloat(dblGeneralTaxSales), 
				"dblGeneralTaxAmount" : parseFloat(dblGeneralTaxAmount), 
				"dblRefundExentAmount" : parseFloat(dblRefundExentAmount), 
				"dblRefundGeneralTaxSales" : parseFloat(dblRefundGeneralTaxSales), 
				"dblRefundGeneralTaxAmount" : parseFloat(dblRefundGeneralTaxAmount),
				"strRestaurantCode" : restCode.toString(),
				"strTerminalName" : term.toString().toUpperCase().trim(),
				"strTerminalSerial" : dataLastSales.strTerminalSerial.toString().trim(),
				"intId_User" : parseInt(userId),
				"strLastNonFiscalDoc" : dataLastSales.strLastNonFiscalDoc.toString(),
				"IntRevId": parseInt(IntRevId),
				"datExecutionWhenZ": dateValue.toString(),
				"datLastInvoiceDate" : dateValue.toString()
			};
			console.log(dataSendInsertForTerminals);
			console.log("=======================");
			console.log("=======================");

			doServerMethodObservable("InsertSalesSumaryWithMemoryFull", 
				JSON.stringify({"salesInfo": dataSendInsertForTerminals}), 
				"SalesPrinterModules/SalesPrinterweb.aspx/").subscribe(
				//success
				(data)=>{
					hideWaitMsg();
					alert("Registro guardado con Exito!");
					//console.log("Success: ", data);
				}, 
				//error
				(err)=>{
					console.log(err);
					alert("error");
				},
				//completed
				(data)=>{
					console.log("comp:", data);
					//return data;
				}
			);
		}
		
	}

	/*General*/
	function formatDate(date){
		let dteFormat = date.split("-");
		dteFormat = dteFormat[2].toString() +"/"+ dteFormat[1].toString() +"/"+  dteFormat[0].toString();
		return dteFormat;
	}

	function hideWaitMsg(){
    	//debugger;
    	window.$("#app.loading .modal").hide();
        window.$("#app").removeClass("loading");
	}

	function showWaitMsg(){
		window.$("#app").removeClass("loading");
		window.$("#app").addClass("loading");
		window.$("#app.loading .modal").show();
	}

</script>


	<h1>Venta Manual 2000</h1>
	<div>
		<div class="content" id="cont-one">
			<div class="title-card"><p>Nueva Venta</p></div>
				{#if parseInt(restCode) > 1}
					<span class="restCode">{restCode}</span>
				{:else}
					<span class="restCode">Sin Rest</span>
				{/if}
			<div style="width: 550px;">
				<!-- Form 1-->
				<form on:submit={onReqLastSale} style="text-align: center;">
					<div style="display: inline-flex;">
						<div style="margin-right: 20px;">
							<label for="dateSale">Fecha de Venta:</label>
							<input type="date" id="dateSale" min="2018-01-01" max="2030-02-25" required />
						</div>
						<div style="margin-right: 20px;">
							<label for="termCombo">Terminal:</label>
							<select bind:value={term} class="select" id="termCombo" required>
								<option value="term1" selected>Terminal 1</option>
								<option value="term2" >Terminal 2</option>
								<option value="term3" >Terminal 3</option>
								<option value="term4" >Terminal 4</option>
								<option value="term5" >Terminal 5</option>
								<option value="term6" >Terminal 6</option>
								<option value="term7" >Terminal 7</option>
							</select>
						</div>
						<div style="margin-right: 20px;PADDING-TOP: 18px;padding-left: 20px;">
							<button class="btn_person">Verificar</button>
						</div>
					</div>
				</form>
				<form on:submit={onSendSale} style="text-align: center;">
					<!-- Div 2-->
					<div style="display: flex;">
						<div style="margin-left: 0px;margin-right: 4px;">
							<label for="LastFact">Ult Factura: </label>
							<input type="text" id="LastFact" disabled/>
						</div>
						<div style="margin-left: 4px;margin-right: 4px;">
							<label for="LastCreditNote">Ult Nota de Credito: </label>
							<input type="text" id="LastCreditNote" disabled/>
						</div>
						<div style="margin-left: 4px;margin-right: 0px;">
							<label for="LastDocNoFiscal">Ult Doc No Fiscal: </label>
							<input type="text" id="LastDocNoFiscal" disabled/>
						</div>
					</div>
					<!-- Div 3-->
					<div style="display: flex;">
						<div style="margin-left: 0px;margin-right: 4px;">
							<label for="MontExent">Monto Exento: </label>
							<input type="text" id="MontExent" disabled/>
						</div>
						<div style="margin-left: 4px;margin-right: 4px;">
							<label for="MontBase">Monto Base: </label>
							<input type="text" id="MontBase" disabled/>
						</div>
						<div style="margin-left: 4px;margin-right: 0px;">
							<label for="MoMontIvantBase">Monto IVA: </label>
							<input type="text" id="MontIva" disabled/>
						</div>
					</div>
					<!-- Div 4-->
					<div style="display: flex;">
						<div style="margin-left: 0px;margin-right: 4px;">
							<label for="CreditNoteExent">Nta Credito Exento: </label>
							<input type="text" id="CreditNoteExent" disabled/>
						</div>
						<div style="margin-left: 4px;margin-right: 4px;">
							<label for="CreditNoteBase">Nta Credito Base: </label>
							<input type="text" id="CreditNoteBase" disabled/>
						</div>
						<div style="margin-left: 4px;margin-right: 0px;">
							<label for="CreditNoteIva">Nta Credito IVA: </label>
							<input type="text" id="CreditNoteIva" disabled/>
						</div>
					</div>
					<!-- Button -->
					<button class="btn_person" disabled>Guardar</button>
				</form>
			</div>
		</div>

		<div class="content" id="cont-two">
			<div class="title-card" style="height: 43px;"><p>Venta Anterior</p></div>
			<div style="width: 500px;">
				{#if (Object.keys(dataLastSales).length === 0 )}
					<div style="height:105px;font-size:17px;">
						<p>Reporte Z: ----<p>
						<p>Fecha Ult Factura: ----</p>
						<p>Serial: ----</p>
					</div>
					<!-- Cont 1-->
					<div style="display: flex;">
						<div class="con-left">
							<p>Ult Factura: </p>
							<span>----</span>
						</div>
						<div class="con-center">
							<p>Ult NC: </p>
							<span>----</span>
						 </div>
						<div class="con-right">
							<p>Ult Doc No Fiscal: </p>
							<span>----</span>
						</div>
					</div>
					<!-- Cont 2-->
					<div style="display: flex;">
						<div class="con-left">
							<p>Exento: </p><span>----</span>
						</div>
						<div class="con-center">
							<p>Base: </p><span>----</span>
						 </div>
						<div class="con-right">
							<p>IVA: </p><span>----</span>
						</div>
					</div>					
					<!-- Cont 3-->
					<div style="display: flex;">
						<div class="con-left">
							<p>NC EXENTO: </p><span>----</span>
						</div>
						<div class="con-center">
							<p>NC BASE: </p><span>----</span>
						 </div>
						<div class="con-right">
							<p>NC IVA: </p><span>----</span>
						</div>
					</div>
					
				{:else}
					<div style="height:105px;font-size:17px;">
						<p>Reporte Z: 1999<p>
						<p>Fecha Ult Factura: {dateLastSale}</p>
						<p>Serial: {dataLastSales.strTerminalSerial}</p>
					</div>
					<!-- Cont 1-->
					<div style="display: flex;">
						<div class="con-left">
							<p>Ult Factura:</p><span>{dataLastSales.strLastInvoiceNumber}</span>
						</div>
						<div class="con-center">
							<p>Ult NC:</p><span>{dataLastSales.strLastCreditNote}</span>
						 </div>
						<div class="con-right">
							<p>Ult Doc No Fiscal:</p><span>{dataLastSales.strLastNonFiscalDoc}</span>
						</div>
					</div>					
					<!-- Cont 2-->
					<div style="display: flex;">
						<div class="con-left">
							<p>Exento: </p><span>{dataLastSales.dblExentAmount}</span>
						</div>
						<div class="con-center">
							<p>Base: </p><span>{dataLastSales.dblGeneralTaxSales}</span>
						 </div>
						<div class="con-right">
							<p>IVA: </p><span>{dataLastSales.dblGeneralTaxAmount}</span>
						</div>
					</div>
					<!-- Cont 3-->
					<div style="display: flex;">
						<div class="con-left">
							<p>NC EXENTO: </p><span>{dataLastSales.dblRefundExentAmount}</span>
						</div>
						<div class="con-center">
							<p>NC BASE: </p><span>{dataLastSales.dblRefundGeneralTaxSales}</span>
						 </div>
						<div class="con-right">
							<p>NC IVA: </p><span>{dataLastSales.dblRefundGeneralTaxAmount}</span>
						</div>
					</div>					
				{/if}
				
			</div>
		</div>
	</div>

	<div class="modal">
		<div class="modal_message">
		   <p> <strong><em></em></strong></p>
		</div>
	</div>


<style>
</style>