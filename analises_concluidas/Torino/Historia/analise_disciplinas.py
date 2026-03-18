import os
import json
from typing import List
from pydantic import BaseModel
from crewai import Agent, Task, Crew, Process, LLM

# 1. MODELOS DE DADOS
class EquivalenciaItem(BaseModel):
    disciplinaTorino: str
    disciplinasUFPB: List[str]

class CursoComEquivalencias(BaseModel):
    nome: str
    equivalencias: List[EquivalenciaItem]

# 2. CONFIGURAÇÃO
os.environ["GEMINI_API_KEY"] = "AIzaSyAy2RIpdYoyC3qw9zaz1k4dZX5--hl-PD4"

gemini_3 = LLM(
    model="gemini/gemini-2.5-flash",
    api_key=os.environ["GEMINI_API_KEY"],
    temperature=0.1
)

def carregar_json(caminho):
    with open(caminho, 'r', encoding='utf-8') as f:
        return json.load(f)

def main():
    print("=" * 60)
    print("ETAPA 2: Mapeamento de Disciplinas Equivalentes")
    print("=" * 60)
    
    # Carrega os dados
    try:
        dados_torino = carregar_json('resultsTorino.json')
        cursos_equivalentes = carregar_json('cursos_equivalentes.json')
        
        # Detecta a instituição do arquivo de cursos equivalentes
        instituicao = cursos_equivalentes.get('instituicao_base', 'UFPB')
        arquivo_instituicao = f"{instituicao}.json"
        
        print(f"\n[INFO] Instituição detectada: {instituicao}")
        print(f"[INFO] Carregando: {arquivo_instituicao}")
        
        dados_instituicao = carregar_json(arquivo_instituicao)
    except FileNotFoundError as e:
        print(f"\n[ERRO] Arquivo não encontrado: {e}")
        print("[DICA] Execute primeiro 'analise_cursos.py' para gerar 'cursos_equivalentes.json'")
        return
    
    print(f"\n[INFO] Disciplinas de Torino: {len(dados_torino)}")
    print(f"[INFO] Cursos equivalentes a processar: {len(cursos_equivalentes['cursos_equivalentes'])}")
    
    # Cria o agente
    analista = Agent(
        role='Especialista em Equivalência de Disciplinas',
        goal=f'Mapear disciplinas equivalentes entre Torino e {instituicao} com precisão semântica',
        backstory="""Você é especialista em análise curricular detalhada. 
        Identifica equivalências entre disciplinas de diferentes universidades 
        considerando conteúdo, objetivos e áreas de conhecimento.""",
        llm=gemini_3,
        verbose=True
    )
    
    # Cria um dicionário para busca rápida dos cursos da instituição
    cursos_dict = {
        curso['titulo']: curso['disciplinas'] 
        for curso in dados_instituicao 
        if isinstance(curso, dict) and 'titulo' in curso and 'disciplinas' in curso
    }
    
    resultados_finais = []
    
    # Processa cada curso equivalente
    for idx, nome_curso in enumerate(cursos_equivalentes['cursos_equivalentes'], 1):
        print(f"\n[{idx}/{len(cursos_equivalentes['cursos_equivalentes'])}] Processando: {nome_curso}")
        
        # Busca as disciplinas deste curso
        disciplinas_curso = cursos_dict.get(nome_curso)
        
        if not disciplinas_curso:
            print(f"  [AVISO] Curso não encontrado no {arquivo_instituicao}, pulando...")
            continue
        
        # Cria tarefa para mapear equivalências
        tarefa = Task(
            description=f"""
            Você precisa encontrar equivalências entre as disciplinas de Torino e as disciplinas do curso da UFPB.
            
            DISCIPLINAS DE TORINO (História - 1º ano):
            {json.dumps([d['nome'] for d in dados_torino], indent=2, ensure_ascii=False)}
            
            DISCIPLINAS DO CURSO DA {instituicao} "{nome_curso}":
            {json.dumps(disciplinas_curso, indent=2, ensure_ascii=False)}
            
            Para CADA disciplina de Torino, identifique:
            - Quais disciplinas da {instituicao} são equivalentes (0, 1 ou mais)
            - Considere equivalência temática, de conteúdo e área de conhecimento
            - Uma disciplina pode não ter equivalente (lista vazia está OK)
            - Uma disciplina pode ter múltiplas equivalentes
            
            IMPORTANTE: Inclua TODAS as disciplinas de Torino no resultado, mesmo que não tenham equivalentes.
            """,
            expected_output=f"Mapeamento completo de equivalências para o curso {nome_curso}",
            agent=analista,
            output_pydantic=CursoComEquivalencias
        )
        
        crew = Crew(agents=[analista], tasks=[tarefa], process=Process.sequential)
        
        try:
            resultado = crew.kickoff()
            curso_mapeado = resultado.pydantic
            resultados_finais.append(curso_mapeado.model_dump())
            
            # Mostra resumo
            total_equivalencias = sum(len(eq.disciplinasUFPB) for eq in curso_mapeado.equivalencias)
            print(f"  [OK] {len(curso_mapeado.equivalencias)} disciplinas analisadas, {total_equivalencias} equivalências encontradas")
            
        except Exception as e:
            print(f"  [ERRO] Falha ao processar: {e}")
    
    # Salva resultado final
    output = {
        "curso_referencia": "História - Università di Torino (1º anno)",
        "instituicao_base": instituicao,
        "total_cursos_analisados": len(resultados_finais),
        "cursos_com_equivalencias": resultados_finais
    }
    
    with open('equivalencias_disciplinas.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print("\n" + "=" * 60)
    print(f"[SUCESSO] Análise completa!")
    print("=" * 60)
    print(f"\n[RESUMO]")
    print(f"  - Cursos analisados: {len(resultados_finais)}")
    
    total_eq = sum(
        len(eq['disciplinasUFPB']) 
        for curso in resultados_finais 
        for eq in curso['equivalencias']
    )
    print(f"  - Total de equivalências encontradas: {total_eq}")
    
    print(f"\n[ARQUIVO GERADO] equivalencias_disciplinas.json")

if __name__ == "__main__":
    main()
