
import React, { useState } from 'react';
import { Shield, Check, X, AlertTriangle, Save, Zap, Activity, Wrench, Bolt, Cpu, ShieldCheck, FileText, Settings, Camera, Trash2 } from 'lucide-react';

export const ChecklistForm = ({ type, taskId, onSubmit, onCancel }: any) => {
  const [formData, setFormData] = useState<any>({
    timestamp: new Date().toISOString()
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const renderFields = () => {
    const renderCheckItem = (label: string, field: string) => (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-alupar-blue/30 transition-all">
        <span className="text-[10px] font-black uppercase text-gray-600 leading-tight pr-4">{label}</span>
        <div className="flex gap-1">
          {['C', 'NC', 'NA'].map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => setFormData({ ...formData, [field]: opt })}
              className={`w-9 h-9 rounded-lg text-[9px] font-black transition-all shadow-sm ${
                formData[field] === opt 
                  ? (opt === 'C' ? 'bg-safety-green text-white shadow-safety-green/20' : opt === 'NC' ? 'bg-safety-red text-white shadow-safety-red/20' : 'bg-gray-400 text-white shadow-gray-400/20') 
                  : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-50'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );

    const renderHeader = (title: string, icon?: React.ReactNode) => (
      <h4 className="text-[10px] font-black text-alupar-blue uppercase mb-3 italic tracking-widest border-b border-alupar-blue/20 pb-2 flex items-center gap-2 mt-6 first:mt-0">
        {icon || <Shield size={14} />} {title}
      </h4>
    );

    const renderMeasurementRow = (label: string, fields: string[]) => (
      <div className="grid grid-cols-4 gap-2 items-center">
        <span className="text-[9px] font-black text-gray-400 uppercase">{label}</span>
        {fields.map(f => (
          <input 
            key={f}
            type="text" 
            placeholder={f.split('_').pop()?.toUpperCase()}
            className="p-2 bg-gray-50 border border-gray-200 rounded text-[10px] font-bold outline-none focus:border-alupar-blue"
            onChange={e => setFormData({...formData, [f]: e.target.value})}
            value={formData[f] || ''}
          />
        ))}
      </div>
    );

    const renderTechnicalData = () => {
      switch (type) {
        case 'PMO 03':
          return (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
               <input type="text" placeholder="Fabricante" className="p-2 text-[10px] border rounded" onChange={e => setFormData({...formData, tech_fabricante: e.target.value})} />
               <input type="text" placeholder="Tipo" className="p-2 text-[10px] border rounded" onChange={e => setFormData({...formData, tech_tipo: e.target.value})} />
               <input type="text" placeholder="N° Série" className="p-2 text-[10px] border rounded" onChange={e => setFormData({...formData, tech_serie: e.target.value})} />
               <input type="text" placeholder="Ano" className="p-2 text-[10px] border rounded" onChange={e => setFormData({...formData, tech_ano: e.target.value})} />
               <input type="text" placeholder="Potência" className="p-2 text-[10px] border rounded" onChange={e => setFormData({...formData, tech_potencia: e.target.value})} />
               <input type="text" placeholder="Tensão PRI" className="p-2 text-[10px] border rounded" onChange={e => setFormData({...formData, tech_vpri: e.target.value})} />
            </div>
          );
        case 'PMO 12':
          return (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
               <input type="text" placeholder="Fabricante" className="p-2 text-[10px] border rounded" onChange={e => setFormData({...formData, tech_fabricante: e.target.value})} />
               <input type="text" placeholder="Tipo" className="p-2 text-[10px] border rounded" onChange={e => setFormData({...formData, tech_tipo: e.target.value})} />
               <input type="text" placeholder="Tensão Nominal" className="p-2 text-[10px] border rounded" onChange={e => setFormData({...formData, tech_vnom: e.target.value})} />
               <input type="text" placeholder="Corrente Nominal" className="p-2 text-[10px] border rounded" onChange={e => setFormData({...formData, tech_inom: e.target.value})} />
               <input type="text" placeholder="N° Série" className="p-2 text-[10px] border rounded" onChange={e => setFormData({...formData, tech_serie: e.target.value})} />
            </div>
          );
        case 'PMO 21':
          return (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
               <input type="text" placeholder="Fabricante" className="p-2 text-[10px] border rounded" onChange={e => setFormData({...formData, tech_fabricante: e.target.value})} />
               <input type="text" placeholder="Modelo IED" className="p-2 text-[10px] border rounded" onChange={e => setFormData({...formData, tech_ied: e.target.value})} />
               <input type="text" placeholder="Versão Firmware" className="p-2 text-[10px] border rounded" onChange={e => setFormData({...formData, tech_firmware: e.target.value})} />
            </div>
          );
        default:
          return (
            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
               <input type="text" placeholder="Fabricante" className="p-2 text-[10px] border rounded" onChange={e => setFormData({...formData, tech_fabricante: e.target.value})} />
               <input type="text" placeholder="N° Série" className="p-2 text-[10px] border rounded" onChange={e => setFormData({...formData, tech_serie: e.target.value})} />
            </div>
          );
      }
    };

    return (
      <div className="space-y-6">
        {/* Session Info */}
        <div className="grid grid-cols-2 gap-3 pb-4 border-b">
           <div className="flex flex-col gap-1">
             <label className="text-[9px] font-black uppercase text-gray-400">N° OS</label>
             <input type="text" className="p-2 text-[10px] border rounded font-bold" onChange={e => setFormData({...formData, header_os: e.target.value})} />
           </div>
           <div className="flex flex-col gap-1">
             <label className="text-[9px] font-black uppercase text-gray-400">N° SGI</label>
             <input type="text" className="p-2 text-[10px] border rounded font-bold" onChange={e => setFormData({...formData, header_sgi: e.target.value})} />
           </div>
        </div>

        {renderHeader('Dados Técnicos', <Settings size={14} />)}
        {renderTechnicalData()}

        {/* Dynamic Fields */}
        {(() => {
          switch (type) {
            case 'PMO 03': // Transformador
              return (
                <div className="space-y-4">
                  {renderHeader('Inspeção Visual / Acionamento Elétrico', <Activity size={14} />)}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {renderCheckItem('Reaperto conexões AT', 'v_reaperto_at')}
                    {renderCheckItem('Pintura e oxidações', 'v_pintura')}
                    {renderCheckItem('Reaperto bornes BT', 'v_reaperto_bt')}
                    {renderCheckItem('Relé Buchholz 1º/2º Estágio', 'v_buchholz')}
                    {renderCheckItem('Manual Ventilação G01/G02', 'v_ventilacao')}
                    {renderCheckItem('Manual Buchholz/DAP/TM', 'v_manual_extra')}
                  </div>

                  {renderHeader('Atividades de Manutenção', <Wrench size={14} />)}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {renderCheckItem('Ensaios FP/Capacitância buchas', 'a_fp_buchas')}
                    {renderCheckItem('Insp. caixa acionamento motorizado', 'a_acionamento')}
                    {renderCheckItem('Insp. conservação metálicas', 'a_conservacao')}
                    {renderCheckItem('Verific. comutação sob carga', 'a_comutacao')}
                    {renderCheckItem('Vazamentos óleo isolante', 'a_vaz_oleo')}
                    {renderCheckItem('Bolsas/membranas expansão', 'a_bolsas')}
                    {renderCheckItem('Aterramento tanque principal', 'a_aterramento')}
                    {renderCheckItem('Conservação vedações painéis', 'a_vedacoes')}
                    {renderCheckItem('Estado saturação sílica gel', 'a_silica')}
                    {renderCheckItem('Circuito relé gás/fluxo/alívio', 'a_reles')}
                    {renderCheckItem('Funcionamento ventiladores/bombas', 'a_resfriamento')}
                    {renderCheckItem('Nível de óleo comutador', 'a_nivel_oleo')}
                    {renderCheckItem('Indicadores nível/temperatura', 'a_temperatura')}
                    {renderCheckItem('Vazamentos gás', 'a_vaz_gas')}
                    {renderCheckItem('Aterramento núcleo', 'a_ater_nucleo')}
                    {renderCheckItem('Aquecimento/iluminação', 'a_clima')}
                  </div>

                  {renderHeader('Transformador com Comutador em Carga', <Bolt size={14} />)}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {renderCheckItem('Inspeção interna comutador', 'c_inspecao')}
                    {renderCheckItem('Desgaste contatos elétricos', 'c_desgaste')}
                    {renderCheckItem('Estado óleo isolante comutadores', 'c_oleo')}
                    {renderCheckItem('Ensaios FP/Resistência isolamento', 'c_ensaios')}
                    {renderCheckItem('Conexões elétricas comutador', 'c_conexoes')}
                    {renderCheckItem('Ensaio relação transformação', 'c_relacao')}
                    {renderCheckItem('Mecanismo de acionamento', 'c_mecanismo')}
                  </div>
                </div>
              );

            case 'PMO 07': // Disjuntor
              return (
                <div className="space-y-4">
                  {renderHeader('Inspeção Visual / Estado Geral', <Activity size={14} />)}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {renderCheckItem('Limpeza de conexões', 'v_limpeza')}
                    {renderCheckItem('Pintura e oxidações', 'v_pintura')}
                    {renderCheckItem('Pressão de SF6', 'v_sf6')}
                    {renderCheckItem('Iluminação/Desumidificação', 'v_clima')}
                    {renderCheckItem('Estado da porcelana', 'v_porcelana')}
                    {renderCheckItem('Manual de Abertura/Fechamento', 'v_manual')}
                    {renderCheckItem('Contador de operações', 'v_contador')}
                  </div>

                  {renderHeader('Atividades Técnicas', <Wrench size={14} />)}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {renderCheckItem('Ensaios resistência de contatos', 'a_res_contato')}
                    {renderCheckItem('Inspeção buchas condensivas', 'a_buchas')}
                    {renderCheckItem('Limpeza e Lubrificação', 'a_lubrificacao')}
                    {renderCheckItem('Medição tempos operação', 'a_tempos')}
                    {renderCheckItem('Remoção de ferrugem/Pintura', 'a_ferrugem')}
                    {renderCheckItem('Teste comando local/distância', 'a_comando')}
                    {renderCheckItem('Bobinas e antibombeamento', 'a_bobinas')}
                    {renderCheckItem('Vazamento hidráulicos/amortecedor', 'a_vaz_hidr')}
                    {renderCheckItem('Vazamentos gás/óleo', 'a_vaz_gas')}
                    {renderCheckItem('Funcionamento densímetros', 'a_densimetros')}
                    {renderCheckItem('Check tanque ar/óleo compressor', 'a_tanque')}
                    {renderCheckItem('Circuitos comando/sinalização', 'a_circuitos')}
                    {renderCheckItem('Sistema acionamento/acessórios', 'a_acionamento')}
                  </div>
                </div>
              );

            case 'PMO 12': // Seccionadora
              return (
                <div className="space-y-4">
                  {renderHeader('Inspeção e Mecanismo', <Activity size={14} />)}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {renderCheckItem('Limpeza conexões', 'v_limpeza')}
                    {renderCheckItem('Pintura e oxidações', 'v_pintura')}
                    {renderCheckItem('Alinhamento contatos (F/M)', 'v_alinhamento')}
                    {renderCheckItem('Lubrificação mecanismo', 'v_lubrificacao')}
                    {renderCheckItem('Pinagem dos tubos', 'v_pinagem')}
                    {renderCheckItem('Operação Abertura/Fechamento', 'v_operacao')}
                    {renderCheckItem('Sinalizações e TAG', 'v_tag')}
                    {renderCheckItem('Conexões Bornes BT', 'v_bornes')}
                  </div>

                  {renderHeader('Atividades e Ajustes', <Wrench size={14} />)}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {renderCheckItem('Limpeza e lubrificante contatos', 'a_lub_contatos')}
                    {renderCheckItem('Inspeção armário comando', 'a_armario')}
                    {renderCheckItem('Cabos BT / Aterramento', 'a_cabos')}
                    {renderCheckItem('Insp. isoladores/colunas/flange', 'a_isoladores')}
                    {renderCheckItem('Estado conservação mecânica', 'a_conservacao')}
                    {renderCheckItem('Lubrif. rolamentos/articulações', 'a_lub_mecanismo')}
                    {renderCheckItem('Aquecimento / Iluminação', 'a_clima')}
                    {renderCheckItem('Ajustes alinhamento/simultaneidade', 'a_ajuste_simult')}
                    {renderCheckItem('Funcionamento Manual/Local', 'a_controles')}
                    {renderCheckItem('Ajustes chaves fim curso', 'a_fim_curso')}
                    {renderCheckItem('Calculo resistência de contato', 'a_res_contato')}
                    {renderCheckItem('Inspeção geral e reaperto', 'a_reaperto')}
                  </div>
                </div>
              );

            case 'PMO 21': // Sistemas de Proteção
              return (
                <div className="space-y-4">
                  {renderHeader('Condições Operacionais', <ShieldCheck size={14} />)}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {renderCheckItem('Comunicação Centro Op. (COS)', 's_com_cos')}
                    {renderCheckItem('Sequência de manobra isolamento', 's_manobra')}
                    {renderCheckItem('Bloqueio de Trip (Atividade)', 's_bloqueio')}
                    {renderCheckItem('Liberar equipamento manobra', 's_liberacao')}
                  </div>
                  {renderHeader('Comunicação e Registros', <Cpu size={14} />)}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {renderCheckItem('Comunicação SCADA validada', 'c_scada')}
                    {renderCheckItem('Comunicação IED validada', 'c_ied')}
                    {renderCheckItem('Telemetria / Telecomando', 'c_telemetria')}
                    {renderCheckItem('Coleta de oscilografia', 'r_osculo')}
                    {renderCheckItem('Registros de eventos', 'r_eventos')}
                    {renderCheckItem('Análise alarmes/falhas', 'r_alarmes')}
                  </div>
                  {renderHeader('Grandezas e Sincronismo', <Activity size={14} />)}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {renderCheckItem('Conferência tensão/corrente/freq', 'g_medições')}
                    {renderCheckItem('Conferência supervisório', 'g_supervisorio')}
                    {renderCheckItem('Sincronismo GPS (Antena)', 't_gps')}
                    {renderCheckItem('Ajuste horário IED', 't_horario')}
                    {renderCheckItem('Status sincronismo OK', 't_status')}
                  </div>
                  {renderHeader('Inspeção Física e Restabelecimento', <ShieldCheck size={14} />)}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {renderCheckItem('Reaperto bornes/conexões', 'f_reaperto')}
                    {renderCheckItem('Inspeção cabos/conectores', 'f_cabos')}
                    {renderCheckItem('Limpeza painel', 'f_limpeza')}
                    {renderCheckItem('LEDs e sinalizações', 'f_leds')}
                    {renderCheckItem('Retirada bloqueio TRIP', 's_reset_trip')}
                    {renderCheckItem('Remover permissão manobra local', 's_reset_local')}
                    {renderCheckItem('Equipamento liberado sistema', 's_finalizado')}
                    {renderCheckItem('Comunicação final COS', 's_final_cos')}
                  </div>
                </div>
              );

            default:
              return (
                <div className="space-y-4">
                  {renderHeader('Inspeção Geral')}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {renderCheckItem('Limpeza', 'l_gen')}
                    {renderCheckItem('Conservação', 'c_gen')}
                    {renderCheckItem('Aterramento', 'a_gen')}
                  </div>
                </div>
              );
          }
        })()}

        {renderHeader('Evidência Fotográfica', <Camera size={14} />)}
        <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
           {formData.photo ? (
             <div className="relative group">
               <img src={formData.photo} alt="Evidência" className="w-full h-48 object-cover rounded-lg" />
               <button 
                 onClick={() => setFormData({ ...formData, photo: null })}
                 className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
               >
                 <Trash2 size={16} />
               </button>
             </div>
           ) : (
             <label className="flex flex-col items-center justify-center h-48 cursor-pointer hover:bg-gray-100 transition-all rounded-lg">
               <div className="bg-white p-4 rounded-full shadow-sm mb-2 text-alupar-blue">
                 <Camera size={32} />
               </div>
               <span className="text-[10px] font-black text-gray-400 uppercase">Tirar ou Anexar Foto da Atividade</span>
               <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
             </label>
           )}
        </div>

        {renderHeader('Equipamentos Utilizados', <Wrench size={14} />)}
        <div className="space-y-2 bg-gray-50 p-4 rounded-xl border">
           <div className="grid grid-cols-3 gap-2">
              <input type="text" placeholder="Instrumento 1" className="p-2 text-[9px] border rounded" onChange={e => setFormData({...formData, eq_instr_1: e.target.value})} />
              <input type="text" placeholder="Modelo" className="p-2 text-[9px] border rounded" onChange={e => setFormData({...formData, eq_mod_1: e.target.value})} />
              <input type="text" placeholder="N° Série" className="p-2 text-[9px] border rounded" onChange={e => setFormData({...formData, eq_ser_1: e.target.value})} />
           </div>
           <div className="grid grid-cols-3 gap-2">
              <input type="text" placeholder="Instrumento 2" className="p-2 text-[9px] border rounded" onChange={e => setFormData({...formData, eq_instr_2: e.target.value})} />
              <input type="text" placeholder="Modelo" className="p-2 text-[9px] border rounded" onChange={e => setFormData({...formData, eq_mod_2: e.target.value})} />
              <input type="text" placeholder="N° Série" className="p-2 text-[9px] border rounded" onChange={e => setFormData({...formData, eq_ser_2: e.target.value})} />
           </div>
        </div>

        {renderHeader('Observações / Considerações Finais', <FileText size={14} />)}
        <textarea 
          placeholder="Descreva observações técnicas ou impeditivos encontrados..."
          className="w-full p-4 bg-gray-50 border rounded-xl text-xs font-bold outline-none h-24"
          onChange={e => setFormData({...formData, observacoes: e.target.value})}
        />
      </div>
    );
  };

  const handleSaveDraft = () => {
    if (taskId) {
      localStorage.setItem(`draft_${taskId}`, JSON.stringify(formData));
      alert('Rascunho salvo localmente.');
    }
  };

  return (
    <div className="fixed inset-0 bg-alupar-dark/90 backdrop-blur-md z-[500] flex items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-3xl overflow-hidden border-t-8 border-alupar-blue flex flex-col h-[90vh]">
        <div className="p-8 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-2xl font-black text-alupar-dark uppercase italic flex items-center gap-2">
              <Shield className="text-alupar-blue" size={24} /> PMO: {type}
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">SISTEMA OFICIAL DE VERIFICAÇÃO</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-red-500">
             <X size={32} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
           <div className="p-6 bg-yellow-50 border border-yellow-100 rounded-xl flex items-center gap-4">
              <AlertTriangle className="text-safety-yellow shrink-0" size={32} />
              <p className="text-[10px] font-bold text-yellow-700 uppercase leading-relaxed">
                Atenção: Todos os itens são de preenchimento obrigatório. 
                A falsidade das informações pode resultar em sanções administrativas conforme NR-10.
              </p>
           </div>

           {/* Dynamic fields based on PMO type */}
           {renderFields()}

           <div className="space-y-4 pt-6 border-t border-dashed">
              <h4 className="text-[10px] font-black text-gray-400 uppercase italic mb-2">Verificações de Campo</h4>
              <div className="flex flex-col gap-2">
                 <label className="text-[10px] font-black uppercase text-gray-400">Estado dos Isoladores</label>
                 <select 
                    onChange={e => setFormData({...formData, isoladores: e.target.value})}
                    className="p-4 bg-gray-50 border rounded-lg font-bold text-sm outline-none"
                 >
                    <option value="">Selecione...</option>
                    <option value="Integro">ÍNTEGRO / SEM AVARIAS</option>
                    <option value="Avariado">COM AVARIAS / SUBSTITUIR</option>
                 </select>
              </div>

              <div className="flex flex-col gap-2">
                 <label className="text-[10px] font-black uppercase text-gray-400">Verificação de Reaperto</label>
                 <div className="flex flex-wrap gap-2">
                    {['Concluído', 'Não se aplica'].map(opt => (
                       <label key={opt} className="flex-1 flex items-center justify-center p-4 border rounded-xl hover:bg-gray-50 cursor-pointer transition-all has-[:checked]:bg-alupar-blue has-[:checked]:text-white">
                          <input type="radio" name="reaperto" value={opt} className="hidden" onChange={e => setFormData({...formData, reaperto: e.target.value})} />
                          <span className="text-[10px] font-black uppercase">{opt}</span>
                       </label>
                    ))}
                 </div>
              </div>

              <div className="flex flex-col gap-2">
                 <label className="text-[10px] font-black uppercase text-gray-400">Limpeza do Ativo</label>
                 <div className="flex flex-wrap gap-2">
                    {['Executada', 'Não executada'].map(opt => (
                       <label key={opt} className="flex-1 flex items-center justify-center p-4 border rounded-xl hover:bg-gray-50 cursor-pointer transition-all has-[:checked]:bg-alupar-blue has-[:checked]:text-white">
                          <input type="radio" name="limpeza" value={opt} className="hidden" onChange={e => setFormData({...formData, limpeza: e.target.value})} />
                          <span className="text-[10px] font-black uppercase">{opt}</span>
                       </label>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        <div className="p-8 bg-gray-50 border-t flex gap-4">
           <button 
              onClick={handleSaveDraft}
              className="flex-1 py-4 border-2 border-gray-200 text-gray-400 font-black uppercase tracking-widest rounded-xl hover:bg-white flex items-center justify-center gap-2"
           >
              <Save size={18} /> Salvar Rascunho
           </button>
           <button 
              onClick={() => onSubmit(formData)}
              className="flex-[2] py-4 bg-safety-green text-white font-black uppercase tracking-widest rounded-xl hover:bg-alupar-dark transition-all flex items-center justify-center gap-2 shadow-xl shadow-safety-green/20"
           >
              <Check size={18} /> Finalizar e Enviar
           </button>
        </div>
      </div>
    </div>
  );
};
