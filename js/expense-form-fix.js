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

    try{
      const handler=form.onsubmit;
      if(typeof handler!=="function"){
        throw new Error("O formulário de despesas não foi inicializado.");
      }
      handler.call(form,{preventDefault(){},target:form,currentTarget:form});
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
