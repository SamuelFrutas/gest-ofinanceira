document.addEventListener("DOMContentLoaded",()=>{
  const form=document.getElementById("expenseForm");
  const button=form?.querySelector(".save-btn");
  if(!form||!button)return;

  button.type="button";

  button.addEventListener("click",()=>{
    if(!form.checkValidity()){
      form.reportValidity();
      return;
    }

    if(form.elements.fixed?.checked&&form.elements.installment?.checked){
      alert("Escolha apenas uma opção: despesa fixa ou compra parcelada.");
      return;
    }

    const nativeDateToString=Date.prototype.toString;
    let restored=false;
    const restoreDate=()=>{
      if(restored)return;
      restored=true;
      Date.prototype.toString=nativeDateToString;
    };

    try{
      // addMonths/dateKey do app recebem tanto strings quanto objetos Date.
      // Durante o envio, normalizamos a conversão de Date para YYYY-MM-DD,
      // evitando Invalid Date nas despesas fixas e parcelas bancárias.
      Date.prototype.toString=function(){
        return this.toISOString().slice(0,10);
      };

      const event=new Event("submit",{bubbles:true,cancelable:true});
      form.dispatchEvent(event);
      setTimeout(restoreDate,0);
    }catch(error){
      restoreDate();
      console.error("Erro ao salvar despesa:",error);
      alert("Não foi possível salvar a despesa. O sistema encontrou um erro e ele foi registrado.");
    }
  });

  window.addEventListener("error",event=>{
    console.error("Erro no sistema:",event.error||event.message);
  });
  window.addEventListener("unhandledrejection",event=>{
    console.error("Erro assíncrono no sistema:",event.reason);
  });
});
