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

    try{
      const handler=form.onsubmit;
      if(typeof handler!=="function"){
        throw new Error("O formulário de despesas não foi inicializado.");
      }

      const nativeDateToString=Date.prototype.toString;
      const restoreDate=()=>{Date.prototype.toString=nativeDateToString};

      Date.prototype.toString=function(){
        return this.toISOString().slice(0,10);
      };

      try{
        handler.call(form,{preventDefault(){},target:form,currentTarget:form});
      }finally{
        restoreDate();
      }
    }catch(error){
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
