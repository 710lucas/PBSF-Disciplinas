import os
import json
from typing import List
from pydantic import BaseModel
from crewai import Agent, Task, Crew, Process, LLM

# 1. MODELO DE DADOS - Lista simples de cursos equivalentes
class CursosEquivalentes(BaseModel):
    cursos: List[str]

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

def escolher_instituicao():
    """Permite escolher a instituição base"""
    instituicoes = ['UFPB', 'UFCG', 'IFPB', 'UEPB']
    
    print("\n" + "=" * 60)
    print("Escolha a instituição base:")
    print("=" * 60)
    for i, inst in enumerate(instituicoes, 1):
        print(f"  {i}. {inst}")
    
    while True:
        try:
            escolha = input("\nDigite o número da instituição (1-4): ").strip()
            idx = int(escolha) - 1
            if 0 <= idx < len(instituicoes):
                return instituicoes[idx]
            else:
                print("[ERRO] Número inválido. Escolha entre 1 e 4.")
        except ValueError:
            print("[ERRO] Digite um número válido.")
        except KeyboardInterrupt:
            print("\n[CANCELADO] Operação cancelada pelo usuário.")
            exit(0)

def main():
    print("=" * 60)
    print("ETAPA 1: Identificação de Cursos Equivalentes")
    print("=" * 60)
    
    # Escolhe a instituição
    instituicao = escolher_instituicao()
    arquivo_instituicao = f"{instituicao}.json"
    
    print(f"\n[INFO] Instituição selecionada: {instituicao}")
    print(f"[INFO] Arquivo: {arquivo_instituicao}")
    
    # Carrega os dados
    try:
        dados_torino = carregar_json('resultsTorino.json')
        dados_instituicao = carregar_json(arquivo_instituicao)
    except FileNotFoundError as e:
        print(f"\n[ERRO] Arquivo não encontrado: {e}")
        print(f"[DICA] Certifique-se de que o arquivo '{arquivo_instituicao}' existe no diretório atual.")
        return
    
    # Extrai apenas os nomes das disciplinas de Torino para análise
    disciplinas_torino = [d['nome'] for d in dados_torino]
    
    # Extrai apenas os títulos dos cursos da instituição
    titulos_cursos = [curso['titulo'] for curso in dados_instituicao if isinstance(curso, dict) and 'titulo' in curso]
    
    print(f"\n[INFO] Disciplinas de Torino (História - 1º ano): {len(disciplinas_torino)}")
    print(f"[INFO] Cursos da {instituicao} para análise: {len(titulos_cursos)}")
    
    # Cria o agente
    analista = Agent(
        role='Especialista em Equivalência de Cursos Universitários',
        goal=f'Identificar cursos da {instituicao} que tenham similaridade temática com o curso de História da Universidade de Torino',
        backstory="""Você é um especialista internacional em análise curricular comparada. 
        Seu trabalho é identificar cursos que compartilhem áreas de conhecimento similares, 
        considerando áreas como História, Ciências Sociais, Humanas, Letras, Filosofia, etc.""",
        llm=gemini_3,
        verbose=True
    )
    
    # Cria a tarefa
    tarefa = Task(
        description=f"""
        Analise o curso de História da Universidade de Torino (1º ano) com base nestas disciplinas:
        {disciplinas_torino}
        
        Agora identifique quais dos seguintes cursos da {instituicao} têm MAIOR similaridade temática:
        {titulos_cursos}
        
        Considere similaridade em áreas como:
        - História e ciências históricas
        - Ciências sociais e humanidades
        - Letras, linguística e estudos culturais
        - Filosofia
        - Geografia (aspectos históricos)
        - Antropologia
        - Arquivologia e ciências da informação
        
        Retorne APENAS os nomes completos dos cursos que são mais relevantes.
        Limite-se aos cursos mais similares (entre 5 e 15 cursos).
        """,
        expected_output=f"Lista de nomes de cursos da {instituicao} equivalentes ao curso de História de Torino.",
        agent=analista,
        output_pydantic=CursosEquivalentes
    )
    
    # Executa
    crew = Crew(agents=[analista], tasks=[tarefa], process=Process.sequential)
    
    try:
        print("\n[PROCESSANDO] Analisando similaridade entre cursos...")
        resultado = crew.kickoff()
        cursos_encontrados = resultado.pydantic
        
        # Salva o resultado
        output = {
            "curso_referencia": "História - Università di Torino (1º anno)",
            "instituicao_base": instituicao,
            "total_cursos_equivalentes": len(cursos_encontrados.cursos),
            "cursos_equivalentes": cursos_encontrados.cursos
        }
        
        with open('cursos_equivalentes.json', 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print("\n" + "=" * 60)
        print(f"[SUCESSO] {len(cursos_encontrados.cursos)} cursos equivalentes identificados!")
        print("=" * 60)
        print("\nCursos encontrados:")
        for i, curso in enumerate(cursos_encontrados.cursos, 1):
            print(f"  {i}. {curso}")
        
        print(f"\n[ARQUIVO GERADO] cursos_equivalentes.json")
        print("\n[PRÓXIMO PASSO] Execute 'analise_disciplinas.py' para mapear as disciplinas equivalentes")
        
    except Exception as e:
        print(f"\n[ERRO] Falha ao processar: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
