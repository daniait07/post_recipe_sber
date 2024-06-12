import React from 'react';
import { createAssistant, createSmartappDebugger } from '@salutejs/client';

import './App.css';
//import {Button} from './components/Button';
//import { log } from 'console';

const initializeAssistant = (getState /*: any*/, getRecoveryState) => {
  if (process.env.NODE_ENV === 'development') {
    return createSmartappDebugger({
      token: process.env.REACT_APP_TOKEN ?? '',
      initPhrase: `Запусти ${process.env.REACT_APP_SMARTAPP}`,
      getState,                                           
      // getRecoveryState: getState,                                           
      nativePanel: {
        defaultText: 'Новый рецепт',
        screenshotMode: false,
        tabIndex: -1,
    },
    });
  } else {
  return createAssistant({ getState });
  }
};

export class App extends React.Component {
  constructor(props) {
    super(props);
    console.log('constructor');

    this.state = {
      number: 16
    };

    this.assistant = initializeAssistant(() => this.getStateForAssistant());
    this.gen_number = this.gen_number.bind(this);

    this.assistant.on('data', (event /*: any*/) => {
      console.log(`assistant.on(data)`, event);
      if (event.type === 'character') {
        console.log(`assistant.on(data): character: "${event?.character?.id}"`);
      } else if (event.type === 'insets') {
        console.log(`assistant.on(data): insets`);
      } else {
        const { action } = event;
        // если приходящий от ассистента ивент отличен от первых двух
        // то выполняем его отдельно
        this.dispatchAssistantAction(action);
      }
    });

    // инициализация при старте приложения
    this.assistant.on('start', (event) => {
      let initialData = this.assistant.getInitialData();

      console.log(`assistant.on(start)`, event, initialData);
    });

    this.assistant.on('command', (event) => {
      console.log(`assistant.on(command)`, event);
    });

    this.assistant.on('error', (event) => {
      console.log(`assistant.on(error)`, event);
    });

    this.assistant.on('tts', (event) => {
      console.log(`assistant.on(tts)`, event);
    });
  }

  // метод вызываемый после монтирования (рендера)
  componentDidMount() {
    console.log('componentDidMount');
    
  }

  // инициализация объекта типа AssistantAppState
  // хранит данные, которые нужны в бэке для принятия решения
  // дает два лога
  getStateForAssistant() {
    console.log('getStateForAssistant: this.state:', this.state);
    const state = {
      // сопоставляет голосовые команды и действия в приложении
      item_selector: {
        // массив соответствий команд и действий 
        //(number-номер в массиве, id - строка-айди, title - слово-активатор для действия)
        // нам не нужно по идее
        // items: this.state.notes.map(({ id, title }, index) => ({
        //   number: index + 1,
        //   id,
        //   title,
        // })),
        // слова, определенные в сценариях
        ignored_words: [
          'добавить','установить','запиши','поставь','закинь','напомнить', // addNote.sc
          'удалить', 'удали',  // deleteNote.sc
          'выполни', 'выполнил', 'сделал' // выполнил|сделал
        ],
      },
    };
    console.log('getStateForAssistant: state:', state);
    return state;
  }

  // выполнение действия по команде
  dispatchAssistantAction(action) {
    console.log('dispatchAssistantAction', action);
    if (action) {
      switch (action.type) {
        case 'generated number':
          this.setState({ number: action.number });
          console.log('returned number', this.state.number);
          break;

        default:
          throw new Error();
      }
    }
  }

 
  // отправка данных на бэк (название и параметр)
  _send_action_value(action_id, value) {
    console.log('send_action', action_id,value);
    // тип AssistantServerAction
    const data = {
      action: {
        action_id: action_id
        //parameters: {
          // значение поля parameters может быть любым, но должно соответствовать серверной логике
        //  value: value, // см.файл src/sc/noteDone.sc смартаппа в Studio Code
        //},
      },
    };
    // в unsubsribe записана функция, которую вернет ассистент
    // вторым аргументом идет лямбда
    const unsubscribe = this.assistant.sendData(data, (data) => {
      // функция, вызываемая, если на sendData() был отправлен ответ
      console.log('sendData onData: data:', data);      

      // в data помещается ответ и данные с бэка в payload?
      const { type, payload } = data;
      
      // вернем число
      unsubscribe();
      //console.log('sendData onData:', type, payload);
      //return payload;
    });
  }

  gen_number() {
    console.log('gen_number');
    
    //const tmp = this._send_action_value('gen', 'message from front method gen');
    this._send_action_value('done', 'message from front method to debug');
    
    
    
    
  }

  // вызываается по нажатию кнопки
  play_done_note(id) {
    // ищет в состоянии ассистента нужную заметку
    const completed = this.state.notes.find(({ id }) => id)?.completed;
    if (!completed) {
      const texts = ['Молодец!', 'Красавчик!', 'Супер!'];
      const idx = (Math.random() * texts.length) | 0;
      this._send_action_value('done', texts[idx]);
    }
  }


  render() {
    console.log('render');
    return (
      <>
        <div>{this.state.number}</div>
        <button type="submit" onClick={this.gen_number}>тык</button>
      </>
    )
  }


  // render() {
  //   console.log('render');
  //   return (
  //     <>
  //       <TaskList
  //         items={this.state.notes}
  //         onAdd={(note) => {
  //           this.add_note({ type: 'add_note', note });
  //         }}
  //         onDone={(note) => {
  //           this.play_done_note(note.id);
  //           this.done_note({ type: 'done_note', id: note.id });
  //         }}
  //       />
  //     </>
  //   );
  // }

}